// =====================================================================
// CONFIGURAÇÃO DO FIREBASE E DO DONO DO APP
// Estes dados do Firebase não são senha: podem ficar no código.
// Quem protege os dados são as regras do firestore.rules.
// =====================================================================
export const FIREBASE_VERSAO = '13.4.0';

export const firebaseConfig = {
  apiKey: 'AIzaSyBwMkoI5W5YYmSkdDbWh5F5K7kP_phs23M',
  authDomain: 'myikariamlog21.firebaseapp.com',
  projectId: 'myikariamlog21',
  storageBucket: 'myikariamlog21.firebasestorage.app',
  messagingSenderId: '680047129963',
  appId: '1:680047129963:web:1f400bff3d9514d910482e',
};

// Dono do app: entra já como administrador e aprova os membros da aliança.
// (Mantenha igual ao e-mail escrito no firestore.rules.)
export const EMAIL_DONO = 'ewert.soares07@gmail.com';

export const NOME_ALIANCA_PADRAO = 'Minha Aliança';

export const PAPEIS_USUARIO = {
  pendente: { nome: 'Aguardando', icone: '⏳', nivel: 0 },
  membro: { nome: 'Membro', icone: '🛡️', nivel: 1 },
  oficial: { nome: 'Oficial', icone: '⭐', nivel: 2 },
  admin: { nome: 'Líder', icone: '👑', nivel: 3 },
};
