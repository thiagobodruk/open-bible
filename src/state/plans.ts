import { create } from 'zustand';
import { dbAll, dbDelete, dbPut } from '../db';
import { newPlan, withMarks, type Plan, type PresetId } from '../data/plans';

interface PlansStore {
  hydrated: boolean;
  plans: Plan[];
  /** Plan the sheet opens on, set by whoever opens it. The sheet takes it and clears it. */
  focus: string | null;
  hydrate: () => Promise<void>;
  create: (init: { name: string; preset?: PresetId; items: string[]; days: number }) => Plan;
  remove: (id: string) => void;
  /** Marks or unmarks chapters of a plan, by index into its `items`. Returns the plan as it ends up, to tell if it just finished. */
  mark: (id: string, indexes: number[], on: boolean) => Plan | undefined;
  /** Adds plans from a backup, keeping the one with more chapters read when an id already exists. */
  merge: (plans: Plan[]) => Promise<void>;
}

const persistFail = () => {
  // A write failure does not break reading.
};

export const usePlans = create<PlansStore>((set, get) => ({
  hydrated: false,
  plans: [],
  focus: null,

  hydrate: async () => {
    try {
      const stored = await dbAll<Plan>('plans');
      // Plans created before loading finishes still count.
      set((s) => ({ plans: [...stored.filter((p) => !s.plans.some((x) => x.id === p.id)), ...s.plans], hydrated: true }));
    } catch {
      set({ hydrated: true });
    }
  },

  create: (init) => {
    const plan = newPlan(init);
    set((s) => ({ plans: [...s.plans, plan] }));
    dbPut('plans', [plan]).catch(persistFail);
    return plan;
  },

  remove: (id) => {
    set((s) => ({ plans: s.plans.filter((p) => p.id !== id) }));
    dbDelete('plans', [id]).catch(persistFail);
  },

  mark: (id, indexes, on) => {
    const cur = get().plans.find((p) => p.id === id);
    if (!cur) return undefined;
    const next = withMarks(cur, indexes, on);
    set((s) => ({ plans: s.plans.map((p) => (p.id === id ? next : p)) }));
    dbPut('plans', [next]).catch(persistFail);
    return next;
  },

  merge: async (incoming) => {
    const byId = new Map(get().plans.map((p) => [p.id, p]));
    for (const p of incoming) {
      const cur = byId.get(p.id);
      if (!cur || cur.done.length < p.done.length) byId.set(p.id, p);
    }
    const plans = [...byId.values()];
    await dbPut('plans', plans);
    set({ plans });
  },
}));
