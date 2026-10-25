/** Configuração web do projeto Firebase. Estas chaves são públicas por design: quem protege os dados são as regras do Firestore e os domínios autorizados. Com `null`, login e sincronização ficam desligados. */
export const firebaseConfig: { apiKey: string; authDomain: string; projectId: string; appId: string; measurementId: string } | null = {
  apiKey: 'AIzaSyAbBpkMn7BhjmJRYi5zmLysZhLj6oTboc0',
  authDomain: 'open-bible-e871a.firebaseapp.com',
  projectId: 'open-bible-e871a',
  appId: '1:359445037013:web:d0c0ebd4de6ec4479b475c',
  measurementId: 'G-XH3NL0HVFK',
};
