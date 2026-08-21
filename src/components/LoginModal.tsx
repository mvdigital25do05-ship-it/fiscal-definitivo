import React, { useState } from 'react';
import {
  LogIn,
  X,
  UserPlus,
  Mail,
  Lock,
  User as UserIcon,
  AlertCircle,
  CheckCircle2,
  Loader2,
  ShieldCheck,
  KeyRound,
  ArrowRight,
} from 'lucide-react';
import {
  signInWithGoogle,
  loginWithEmail,
  registerWithEmail,
  sendPasswordReset,
  translateAuthError,
} from '../lib/firebase';
import type { UserProfile } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: any) => void;
}

export const LoginModal: React.FC<Props> = ({ isOpen, onClose, onSuccess }) => {
  const [activeTab, setActiveTab] = useState<'login' | 'register' | 'forgot'>('login');

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');

  // UI status
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setDisplayName('');
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  // Google Login Handler
  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const user = await signInWithGoogle();
      if (user) {
        onSuccess({
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || 'Estudante Fiscal',
          photoURL: user.photoURL || '',
          role: user.email?.includes('admin') || user.email === 'matheusleal25do05@gmail.com' ? 'admin' : 'admin',
        });
        handleClose();
      }
    } catch (err: any) {
      setErrorMessage(translateAuthError(err));
    } finally {
      setIsLoading(false);
    }
  };

  // Email/Password Login Handler
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setErrorMessage('Por favor, informe o e-mail e a senha.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    try {
      const user = await loginWithEmail(email, password);
      if (user) {
        onSuccess({
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || email.split('@')[0],
          photoURL: user.photoURL || '',
          role: email.includes('admin') || email === 'matheusleal25do05@gmail.com' ? 'admin' : 'admin',
        });
        handleClose();
      }
    } catch (err: any) {
      setErrorMessage(translateAuthError(err));
    } finally {
      setIsLoading(false);
    }
  };

  // Register Handler
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setErrorMessage('Preencha todos os campos obrigatórios.');
      return;
    }
    if (password.length < 6) {
      setErrorMessage('A senha deve conter no mínimo 6 caracteres.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage('As senhas não coincidem.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    try {
      const user = await registerWithEmail(email, password, displayName);
      if (user) {
        onSuccess({
          uid: user.uid,
          email: user.email,
          displayName: displayName.trim() || email.split('@')[0],
          photoURL: '',
          role: email.includes('admin') || email === 'matheusleal25do05@gmail.com' ? 'admin' : 'admin',
        });
        handleClose();
      }
    } catch (err: any) {
      setErrorMessage(translateAuthError(err));
    } finally {
      setIsLoading(false);
    }
  };

  // Forgot Password Handler
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setErrorMessage('Por favor, informe seu e-mail para recuperar a senha.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    try {
      await sendPasswordReset(email);
      setSuccessMessage('E-mail de recuperação enviado! Verifique sua caixa de entrada.');
    } catch (err: any) {
      setErrorMessage(translateAuthError(err));
    } finally {
      setIsLoading(false);
    }
  };

  // Quick Guest Login Handler
  const handleGuestSignIn = (role: 'user' | 'admin') => {
    const mockUser: UserProfile = {
      uid: role === 'admin' ? 'admin_test_user' : 'student_test_user',
      email: role === 'admin' ? 'matheusleal25do05@gmail.com' : 'estudante@fiscalquestoes.com.br',
      displayName: role === 'admin' ? 'Auditor Fiscal (Admin)' : 'Estudante Fiscal',
      photoURL: '',
      role: 'admin',
      createdAt: Date.now(),
      lastLoginAt: Date.now(),
    };
    onSuccess(mockUser);
    handleClose();
  };

  return (
    <div
      id="login-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#1A1A1A]/50 backdrop-blur-xs p-4 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div className="bg-[#FAF8F5] rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.2)] border border-[#EAE6DF] w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-8">
        {/* Header */}
        <div className="p-6 border-b border-[#EAE6DF] flex items-center justify-between bg-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#1C1917] flex items-center justify-center text-white">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-editorial-heading text-lg font-bold text-[#1A1A1A]">Fiscal Questões</h2>
              <p className="font-editorial-serif text-xs text-[#78716C]">
                {activeTab === 'login' && 'Acesse sua conta para salvar seu progresso'}
                {activeTab === 'register' && 'Crie sua conta e estude de qualquer lugar'}
                {activeTab === 'forgot' && 'Recuperação de acesso à conta'}
              </p>
            </div>
          </div>
          <button
            id="close-login-modal-btn"
            onClick={handleClose}
            className="p-1.5 rounded-lg text-[#78716C] hover:text-[#1A1A1A] hover:bg-[#F2EDE4] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        {activeTab !== 'forgot' && (
          <div className="grid grid-cols-2 p-2 bg-[#F2EDE4] border-b border-[#EAE6DF] gap-1 text-xs font-semibold">
            <button
              id="tab-login-btn"
              onClick={() => {
                setActiveTab('login');
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
              className={`py-2 px-3 rounded-lg text-center transition-all cursor-pointer ${
                activeTab === 'login'
                  ? 'bg-white text-[#1C1917] shadow-2xs font-bold'
                  : 'text-[#78716C] hover:text-[#1C1917]'
              }`}
            >
              Entrar
            </button>
            <button
              id="tab-register-btn"
              onClick={() => {
                setActiveTab('register');
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
              className={`py-2 px-3 rounded-lg text-center transition-all cursor-pointer ${
                activeTab === 'register'
                  ? 'bg-white text-[#1C1917] shadow-2xs font-bold'
                  : 'text-[#78716C] hover:text-[#1C1917]'
              }`}
            >
              Criar Conta
            </button>
          </div>
        )}

        <div className="p-6 space-y-4">
          {/* Status Banners */}
          {errorMessage && (
            <div
              id="auth-error-banner"
              className="flex items-start gap-2.5 p-3.5 bg-[#FEF2F2] border border-[#FCA5A5] text-[#991B1B] text-xs rounded-xl"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="font-medium leading-relaxed">{errorMessage}</div>
            </div>
          )}

          {successMessage && (
            <div
              id="auth-success-banner"
              className="flex items-start gap-2.5 p-3.5 bg-[#F0FDF4] border border-[#86EFAC] text-[#166534] text-xs rounded-xl"
            >
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="font-medium leading-relaxed">{successMessage}</div>
            </div>
          )}

          {/* Google Sign-in Primary Button */}
          {activeTab !== 'forgot' && (
            <>
              <button
                id="google-signin-btn"
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-3 px-4 py-2.5 bg-white hover:bg-[#FAF8F5] active:bg-[#F2EDE4] text-[#1C1917] font-semibold text-xs rounded-xl border border-[#D6CEBE] shadow-2xs transition-all cursor-pointer disabled:opacity-50"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Continuar com Google</span>
              </button>

              <div className="relative flex items-center justify-center my-3">
                <div className="border-t border-[#EAE6DF] w-full" />
                <span className="bg-[#FAF8F5] px-3 text-[10px] text-[#A8A29E] uppercase font-mono font-bold tracking-widest absolute">
                  ou utilize seu e-mail
                </span>
              </div>
            </>
          )}

          {/* Form Content */}
          {activeTab === 'login' && (
            <form onSubmit={handleEmailLogin} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-[#44403C] mb-1">E-mail</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#A8A29E] absolute left-3 top-3" />
                  <input
                    id="login-email-input"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu.email@exemplo.com"
                    className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-[#D6CEBE] rounded-xl text-[#1C1917] focus:outline-hidden focus:border-[#1C1917] focus:ring-1 focus:ring-[#1C1917] placeholder:text-[#A8A29E]"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-[#44403C]">Senha</label>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('forgot');
                      setErrorMessage(null);
                      setSuccessMessage(null);
                    }}
                    className="text-[11px] text-[#78716C] hover:text-[#1C1917] hover:underline cursor-pointer"
                  >
                    Esqueceu a senha?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#A8A29E] absolute left-3 top-3" />
                  <input
                    id="login-password-input"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Sua senha secreta"
                    className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-[#D6CEBE] rounded-xl text-[#1C1917] focus:outline-hidden focus:border-[#1C1917] focus:ring-1 focus:ring-[#1C1917] placeholder:text-[#A8A29E]"
                  />
                </div>
              </div>

              <button
                id="submit-login-btn"
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-[#1C1917] hover:bg-[#292524] active:bg-[#0C0A09] text-white font-semibold text-xs rounded-xl shadow-2xs transition-all cursor-pointer disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Entrando...</span>
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span>Acessar Plataforma</span>
                  </>
                )}
              </button>
            </form>
          )}

          {activeTab === 'register' && (
            <form onSubmit={handleRegister} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-[#44403C] mb-1">Nome Completo</label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-[#A8A29E] absolute left-3 top-3" />
                  <input
                    id="register-name-input"
                    type="text"
                    required
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Ex: Matheus Leal"
                    className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-[#D6CEBE] rounded-xl text-[#1C1917] focus:outline-hidden focus:border-[#1C1917] focus:ring-1 focus:ring-[#1C1917] placeholder:text-[#A8A29E]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#44403C] mb-1">E-mail</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#A8A29E] absolute left-3 top-3" />
                  <input
                    id="register-email-input"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu.email@exemplo.com"
                    className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-[#D6CEBE] rounded-xl text-[#1C1917] focus:outline-hidden focus:border-[#1C1917] focus:ring-1 focus:ring-[#1C1917] placeholder:text-[#A8A29E]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-semibold text-[#44403C] mb-1">Senha (6+ car.)</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-[#A8A29E] absolute left-3 top-3" />
                    <input
                      id="register-password-input"
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Mínimo 6"
                      className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-[#D6CEBE] rounded-xl text-[#1C1917] focus:outline-hidden focus:border-[#1C1917] focus:ring-1 focus:ring-[#1C1917] placeholder:text-[#A8A29E]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#44403C] mb-1">Confirmar Senha</label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-[#A8A29E] absolute left-3 top-3" />
                    <input
                      id="register-confirm-password-input"
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repita a senha"
                      className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-[#D6CEBE] rounded-xl text-[#1C1917] focus:outline-hidden focus:border-[#1C1917] focus:ring-1 focus:ring-[#1C1917] placeholder:text-[#A8A29E]"
                    />
                  </div>
                </div>
              </div>

              <button
                id="submit-register-btn"
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-[#1C1917] hover:bg-[#292524] active:bg-[#0C0A09] text-white font-semibold text-xs rounded-xl shadow-2xs transition-all cursor-pointer disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Criando conta...</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    <span>Cadastrar e Começar</span>
                  </>
                )}
              </button>
            </form>
          )}

          {activeTab === 'forgot' && (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#44403C] mb-1">
                  E-mail cadastrado
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#A8A29E] absolute left-3 top-3" />
                  <input
                    id="forgot-email-input"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu.email@exemplo.com"
                    className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-[#D6CEBE] rounded-xl text-[#1C1917] focus:outline-hidden focus:border-[#1C1917] focus:ring-1 focus:ring-[#1C1917] placeholder:text-[#A8A29E]"
                  />
                </div>
                <p className="text-[11px] text-[#78716C] mt-1 font-editorial-serif">
                  Enviaremos um link seguro para você redefinir sua senha.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('login');
                    setErrorMessage(null);
                    setSuccessMessage(null);
                  }}
                  className="flex-1 py-2 px-3 bg-white border border-[#D6CEBE] text-[#44403C] hover:bg-[#F2EDE4] font-semibold text-xs rounded-xl transition-all cursor-pointer text-center"
                >
                  Voltar
                </button>
                <button
                  id="submit-forgot-btn"
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-[#1C1917] hover:bg-[#292524] text-white font-semibold text-xs rounded-xl transition-all cursor-pointer disabled:opacity-50"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Enviar Link</span>}
                </button>
              </div>
            </form>
          )}

          {/* Quick Demo Access Bar */}
          <div className="pt-2 border-t border-[#EAE6DF]">
            <div className="text-[11px] font-mono font-bold text-[#78716C] mb-2 uppercase tracking-wider text-center">
              Acesso Rápido de Teste
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                id="demo-student-btn"
                type="button"
                onClick={() => handleGuestSignIn('user')}
                className="p-2.5 bg-white hover:bg-[#F2EDE4] border border-[#D6CEBE] hover:border-[#1C1917] rounded-xl text-left transition-all cursor-pointer group"
              >
                <div className="text-xs font-bold text-[#1C1917] flex items-center justify-between">
                  <span>Modo Estudante</span>
                  <ArrowRight className="w-3 h-3 text-[#A8A29E] group-hover:text-[#1C1917] transition-colors" />
                </div>
                <div className="text-[10px] text-[#78716C] font-mono mt-0.5">Aluno Concurso</div>
              </button>

              <button
                id="demo-admin-btn"
                type="button"
                onClick={() => handleGuestSignIn('admin')}
                className="p-2.5 bg-white hover:bg-[#F2EDE4] border border-[#D6CEBE] hover:border-[#1C1917] rounded-xl text-left transition-all cursor-pointer group"
              >
                <div className="text-xs font-bold text-[#1C1917] flex items-center justify-between">
                  <span>Auditor Fiscal</span>
                  <ArrowRight className="w-3 h-3 text-[#A8A29E] group-hover:text-[#1C1917] transition-colors" />
                </div>
                <div className="text-[10px] text-[#78716C] font-mono mt-0.5">Acesso Completo (Admin)</div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
