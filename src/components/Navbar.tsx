import React from 'react';
import {
  BookOpenCheck,
  User as UserIcon,
  LogOut,
  LogIn,
  UploadCloud,
  FileText,
  Layers,
  Sparkles,
  BookX, Moon, Sun,
} from 'lucide-react';
import type { UserProfile } from '../types';

interface Props {
  user: UserProfile | null;
  onLoginClick: () => void;
  onLogoutClick: () => void;
  currentView: string;
  onNavigate: (view: 'study' | 'disciplines' | 'errors' | 'import') => void;
  totalQuestionsCount?: number;
}

export const Navbar: React.FC<Props> = ({
  user,
  onLoginClick,
  onLogoutClick,
  currentView,
  onNavigate,
  totalQuestionsCount,
}) => {
  const [isDark, setIsDark] = React.useState(false);

  React.useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
      document.documentElement.classList.add('dark');
      setIsDark(true);
    } else {
      document.documentElement.classList.remove('dark');
      setIsDark(false);
    }
  }, []);

  const toggleTheme = () => {
    if (isDark) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      setIsDark(false);
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      setIsDark(true);
    }
  };

  return (
    <header id="app-navbar" className="sticky top-0 z-30 bg-[#FAF8F5] border-b border-[#EAE6DF] shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Left branding */}
        <div className="flex items-center gap-3">
          <div
            id="brand-logo-btn"
            onClick={() => onNavigate('study')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-lg bg-[#1C1917] flex items-center justify-center text-[#FAF8F5] shadow-xs group-hover:bg-[#292524] transition-colors border border-[#1C1917]">
              <BookOpenCheck className="w-5 h-5 text-[#FAF8F5]" />
            </div>
            <div>
              <div className="font-editorial-heading text-base font-bold text-[#1A1A1A] tracking-tight leading-none flex items-center gap-2">
                <span>FISCAL QUESTÕES</span>
              </div>
              <div className="text-[11px] text-[#78716C] font-normal leading-none mt-1 font-editorial-serif">
                Treino Ativo & Resolução
              </div>
            </div>
          </div>
        </div>

        {/* Center Primary Mode Switcher */}
        <div className="flex items-center gap-1.5 bg-[#F2EDE4] p-1 rounded-xl border border-[#EAE6DF]">
          <button
            id="nav-study-tab-btn"
            onClick={() => onNavigate('study')}
            className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              currentView === 'study'
                ? 'bg-[#1C1917] text-[#FAF8F5] shadow-2xs'
                : 'text-[#57534E] hover:text-[#1A1A1A] hover:bg-[#EAE5D9]'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Sessão de Estudo</span>
          </button>

          <button
            id="nav-disciplines-tab-btn"
            onClick={() => onNavigate('disciplines')}
            className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              currentView === 'disciplines'
                ? 'bg-[#1C1917] text-[#FAF8F5] shadow-2xs'
                : 'text-[#57534E] hover:text-[#1A1A1A] hover:bg-[#EAE5D9]'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Disciplinas & Tópicos</span>
          </button>

          <button
            id="nav-errors-tab-btn"
            onClick={() => onNavigate('errors')}
            className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              currentView === 'errors'
                ? 'bg-[#1C1917] text-[#FAF8F5] shadow-2xs'
                : 'text-[#57534E] hover:text-[#1A1A1A] hover:bg-[#EAE5D9]'
            }`}
          >
            <BookX className="w-3.5 h-3.5 text-[#B45309]" />
            <span>Caderno de Erros</span>
          </button>

          <button
            id="nav-import-tab-btn"
            onClick={() => onNavigate('import')}
            className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              currentView === 'import'
                ? 'bg-[#1C1917] text-[#FAF8F5] shadow-2xs'
                : 'text-[#57534E] hover:text-[#1A1A1A] hover:bg-[#EAE5D9]'
            }`}
          >
            <UploadCloud className="w-3.5 h-3.5" />
            <span>Importador JSON</span>
          </button>
        </div>

        {/* Right user & question count area */}
        <div className="flex items-center gap-3">
          <button
            onClick={toggleTheme}
            title="Alternar tema"
            className="p-2 text-[#78716C] hover:text-[#1C1917] hover:bg-[#EAE5D9] rounded-lg transition-colors cursor-pointer"
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          {typeof totalQuestionsCount === 'number' && (
            <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 bg-white border border-[#EAE6DF] rounded-lg text-xs font-mono text-[#57534E]">
              <span className="w-2 h-2 rounded-full bg-[#15803D] animate-pulse"></span>
              <span><strong>{totalQuestionsCount}</strong> questões</span>
            </div>
          )}

          {user ? (
            <div className="flex items-center gap-2.5">
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-xs font-semibold text-[#1C1917] leading-tight">
                  {user.displayName || 'Estudante Fiscal'}
                </span>
                <span className="text-[11px] text-[#78716C] leading-tight font-mono">
                  {user.email}
                </span>
              </div>

              <div
                className="w-8 h-8 rounded-full bg-[#EAE5D9] border border-[#D6CEBE] flex items-center justify-center text-[#1C1917] font-bold text-xs overflow-hidden"
                title={user.email}
              >
                {user.photoURL ? (
                  <img src={user.photoURL} alt={user.displayName} className="w-full h-full object-cover" />
                ) : (
                  <span>{(user.displayName || user.email || 'U').charAt(0).toUpperCase()}</span>
                )}
              </div>

              <button
                id="logout-btn"
                onClick={onLogoutClick}
                title="Sair da conta"
                className="p-2 text-[#78716C] hover:text-[#1C1917] hover:bg-[#EAE5D9] rounded-lg transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              id="nav-login-btn"
              onClick={onLoginClick}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-[#1C1917] hover:bg-[#292524] rounded-lg shadow-2xs transition-colors cursor-pointer"
            >
              <LogIn className="w-4 h-4 text-[#FDFCF8]" />
              <span>Entrar</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

