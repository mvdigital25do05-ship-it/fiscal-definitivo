import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  sendPasswordResetEmail,
  signOut as fbSignOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const db = firebaseConfig.firestoreDatabaseId
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export async function loginWithGoogle(): Promise<User> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (err: any) {
    console.error('Error signing in with Google:', err);
    throw err;
  }
}

export const signInWithGoogle = loginWithGoogle;

export async function loginWithEmail(email: string, pass: string): Promise<User> {
  try {
    const result = await signInWithEmailAndPassword(auth, email.trim(), pass);
    return result.user;
  } catch (err: any) {
    console.error('Error signing in with Email:', err);
    throw err;
  }
}

export async function registerWithEmail(email: string, pass: string, displayName?: string): Promise<User> {
  try {
    const result = await createUserWithEmailAndPassword(auth, email.trim(), pass);
    if (displayName && result.user) {
      await updateProfile(result.user, { displayName: displayName.trim() });
    }
    return result.user;
  } catch (err: any) {
    console.error('Error registering with Email:', err);
    throw err;
  }
}

export async function sendPasswordReset(email: string): Promise<void> {
  try {
    await sendPasswordResetEmail(auth, email.trim());
  } catch (err: any) {
    console.error('Error sending password reset:', err);
    throw err;
  }
}

export async function logoutUser(): Promise<void> {
  return fbSignOut(auth);
}

export const signOutUser = logoutUser;

export function subscribeToAuthChanges(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}

export function translateAuthError(error: any): string {
  const code = error?.code || error?.message || '';
  if (code.includes('auth/invalid-credential') || code.includes('auth/wrong-password') || code.includes('auth/user-not-found')) {
    return 'E-mail ou senha incorretos. Verifique suas credenciais.';
  }
  if (code.includes('auth/email-already-in-use')) {
    return 'Este e-mail já está cadastrado. Tente entrar ou recuperar a senha.';
  }
  if (code.includes('auth/weak-password')) {
    return 'A senha é muito fraca. Utilize pelo menos 6 caracteres.';
  }
  if (code.includes('auth/invalid-email')) {
    return 'Formato de e-mail inválido.';
  }
  if (code.includes('auth/popup-closed-by-user')) {
    return 'A janela de autenticação do Google foi fechada antes de concluir.';
  }
  if (code.includes('auth/network-request-failed')) {
    return 'Falha de conexão com os servidores de autenticação.';
  }
  return error?.message || 'Ocorreu um erro na autenticação. Tente novamente.';
}
