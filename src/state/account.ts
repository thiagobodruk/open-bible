import { create } from 'zustand';
import type { Auth, User } from 'firebase/auth';
import { firebaseConfig } from '../firebase-config';
import { track } from '../analytics';
import { savedAcceptance } from './terms';
import { onSyncStatus, startSync, stopSync, type SyncStatus } from '../sync';
import { getItem, getJson, removeItem, setItem, setJson } from '../storage';

export interface Profile {
  name: string;
  photo: string | null;
}

export type SignInResult = 'ok' | 'restored' | 'cancelled' | 'offline' | 'failed';

/** Last known profile, so the menu opens with the right account, even offline. */
const KEY = 'ob:account';
/** Marks the trip to Google by redirect, so Firebase loads on return. */
const REDIRECT = 'ob:auth-redirect';

export const accountAvailable = () => firebaseConfig !== null;

function savedProfile(): Profile | null {
  const p = getJson<{ name?: unknown; photo?: unknown } | null>(KEY, null);
  return p && typeof p.name === 'string' ? { name: p.name, photo: typeof p.photo === 'string' ? p.photo : null } : null;
}

function saveProfile(p: Profile | null) {
  if (p) setJson(KEY, p);
  else removeItem(KEY);
}

const profileOf = (u: User | null): Profile | null => (u ? { name: u.displayName ?? u.email ?? '', photo: u.photoURL } : null);

interface Loaded {
  auth: Auth;
  mod: typeof import('firebase/auth');
}

let loading: Promise<Loaded> | null = null;

/** Loads Firebase only when someone needs it, to keep the first open light. */
export function warmAccount(): Promise<Loaded> {
  if (!loading) {
    loading = (async () => {
      const [{ getApps, initializeApp }, mod] = await Promise.all([import('firebase/app'), import('firebase/auth')]);
      const auth = mod.getAuth(getApps()[0] ?? initializeApp(firebaseConfig!));
      mod.onAuthStateChanged(auth, (u) => {
        const profile = profileOf(u);
        saveProfile(profile);
        useAccount.setState({ user: profile });
        if (u) {
          void saveAcceptance(u.uid);
          void startSync(u.uid).catch(() => undefined);
        }
        else stopSync();
      });
      return { auth, mod };
    })();
    loading.catch(() => {
      loading = null;
    });
  }
  return loading;
}

/** Writes the terms acceptance made on this device to Firestore, once per account. Failing here does not block sign-in. */
async function saveAcceptance(uid: string) {
  const a = savedAcceptance();
  const mark = `ob:terms-synced:${uid}`;
  try {
    if (!a || getItem(mark) === a.version) return;
    const [{ getApps }, fs] = await Promise.all([import('firebase/app'), import('firebase/firestore')]);
    await fs.setDoc(fs.doc(fs.getFirestore(getApps()[0]), 'users', uid), { terms: { version: a.version, acceptedAt: a.at } }, { merge: true });
    setItem(mark, a.version);
  } catch {
    /* tries again on the next sign-in */
  }
}

/** Removes the deletion mark from an account that signs in again. Failing here does not block sign-in. */
async function restoreIfDeleted(uid: string): Promise<boolean> {
  try {
    const [{ getApps }, fs] = await Promise.all([import('firebase/app'), import('firebase/firestore')]);
    const ref = fs.doc(fs.getFirestore(getApps()[0]), 'users', uid);
    if (!(await fs.getDoc(ref)).data()?.deletedAt) return false;
    await fs.updateDoc(ref, { deletedAt: fs.deleteField() });
    return true;
  } catch {
    return false;
  }
}

const codeOf = (e: unknown) => (e as { code?: string })?.code ?? '';

interface AccountStore {
  user: Profile | null;
  sync: SyncStatus;
  busy: boolean;
  signIn: () => Promise<SignInResult>;
  signOut: () => Promise<void>;
  /** Soft delete: sets `users/{uid}.deletedAt` in Firestore and signs out. Permanent removal of the data happens later. */
  deleteAccount: () => Promise<void>;
}

export const useAccount = create<AccountStore>((set) => ({
  user: accountAvailable() ? savedProfile() : null,
  sync: 'idle',
  busy: false,
  signIn: async () => {
    set({ busy: true });
    try {
      const { auth, mod } = await warmAccount();
      const provider = new mod.GoogleAuthProvider();
      try {
        const { user } = await mod.signInWithPopup(auth, provider);
        track('sign_in', { method: 'google' });
        if (await restoreIfDeleted(user.uid)) return 'restored';
      } catch (e) {
        // Some browsers and installed PWAs do not open popups. In those cases sign-in goes through a redirect.
        if (codeOf(e) !== 'auth/popup-blocked' && codeOf(e) !== 'auth/operation-not-supported-in-this-environment') throw e;
        try {
          sessionStorage.setItem(REDIRECT, '1');
        } catch {
          /* without the mark, Firebase loads on the next open */
        }
        await mod.signInWithRedirect(auth, provider);
      }
      return 'ok';
    } catch (e) {
      const code = codeOf(e);
      if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') return 'cancelled';
      if (code === 'auth/network-request-failed' || !navigator.onLine) return 'offline';
      return 'failed';
    } finally {
      set({ busy: false });
    }
  },
  signOut: async () => {
    const { auth, mod } = await warmAccount();
    await mod.signOut(auth);
  },
  deleteAccount: async () => {
    const { auth, mod } = await warmAccount();
    const uid = auth.currentUser?.uid;
    if (!uid) throw new Error('not_signed_in');
    const [{ getApps }, fs] = await Promise.all([import('firebase/app'), import('firebase/firestore')]);
    await fs.setDoc(fs.doc(fs.getFirestore(getApps()[0]), 'users', uid), { deletedAt: fs.serverTimestamp() }, { merge: true });
    await mod.signOut(auth);
  },
}));

onSyncStatus((sync) => useAccount.setState({ sync }));

/** On startup, loads Firebase only for people who already have an account or just returned from a redirect sign-in. */
export function initAccount() {
  if (!accountAvailable()) return;
  let redirected = false;
  try {
    redirected = sessionStorage.getItem(REDIRECT) === '1';
    sessionStorage.removeItem(REDIRECT);
  } catch {
    /* continues without the mark */
  }
  if (redirected || savedProfile()) void warmAccount().catch(() => undefined);
}
