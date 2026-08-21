import React from 'react';
import {
  LayoutDashboard,
  SlidersHorizontal,
  GraduationCap,
  Timer,
  BarChart3,
  BookmarkCheck,
  ShieldCheck,
  UploadCloud,
  MessageSquareWarning,
  X,
  Compass,
  Scroll,
} from 'lucide-react';

interface Props {
  currentView: string;
  onNavigate: (view: string) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  isAdmin: boolean;
  activeSessionId?: string;
  activeSessionMode?: 'study' | 'simulado';
}

export const Sidebar: React.FC<Props> = ({
  currentView,
  onNavigate,
  isOpenMobile,
  onCloseMobile,
  isAdmin,
  activeSessionId,
  activeSessionMode,
}) => {
  const navItems = [
    { id: 'dashboard', label: 'Início', icon: LayoutDashboard },
    { id: 'session-config', label: 'Montar Sessão', icon: SlidersHorizontal },
    ...(activeSessionId
      ? [
          {
            id: activeSessionMode === 'simulado' ? 'simulado' : 'study',
            label: activeSessionMode === 'simulado' ? 'Simulado Ativo' : 'Estudo Ativo',
            icon: activeSessionMode === 'simulado' ? Timer : GraduationCap,
            badge: 'Em curso',
          },
        ]
      : []),
    { id: 'performance', label: 'Desempenho', icon: BarChart3 },
    { id: 'favorites', label: 'Favoritas & Revisão', icon: BookmarkCheck },
  ];

  const adminItems = [
    { id: 'admin-questions', label: 'Banco de Questões', icon: ShieldCheck },
    { id: 'admin-import', label: 'Importador JSON', icon: UploadCloud },
    { id: 'admin-reports', label: 'Relatórios de Problemas', icon: MessageSquareWarning },
  ];

  const handleSelect = (viewId: string) => {
    onNavigate(viewId);
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpenMobile && (
        <div
          id="sidebar-mobile-backdrop"
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-stone-900/40 backdrop-blur-xs md:hidden"
        />
      )}

      {/* Sidebar container */}
      <aside
        id="app-sidebar"
        className={`fixed md:sticky top-0 md:top-16 z-40 md:z-20 h-screen md:h-[calc(100vh-4rem)] w-64 bg-[#FAF8F5] border-r border-[#EAE6DF] flex flex-col justify-between transition-transform duration-200 ease-in-out ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="p-4 space-y-6 overflow-y-auto flex-1">
          {/* Mobile Header Close */}
          <div className="flex items-center justify-between md:hidden pb-3 border-b border-[#EAE6DF]">
            <span className="font-editorial-heading text-sm font-bold text-[#1A1A1A]">Menu Principal</span>
            <button
              id="close-mobile-sidebar-btn"
              onClick={onCloseMobile}
              className="p-1 rounded-lg text-[#78716C] hover:text-[#1A1A1A] hover:bg-[#F0ECE1]"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Main navigation */}
          <div>
            <div className="text-[10px] font-mono font-bold text-[#78716C] uppercase tracking-wider px-3 mb-2">
              Estudo & Treino
            </div>
            <div className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentView === item.id;
                return (
                  <button
                    key={item.id}
                    id={`sidebar-link-${item.id}`}
                    onClick={() => handleSelect(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-[#1C1917] text-[#FAF8F5] font-semibold shadow-2xs'
                        : 'text-[#57534E] hover:bg-[#F2ECE0] hover:text-[#1A1A1A]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className={`w-4 h-4 ${isActive ? 'text-[#FAF8F5]' : 'text-[#78716C]'}`} />
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full font-semibold ${
                        isActive ? 'bg-[#FAF8F5] text-[#1C1917]' : 'bg-[#B45309] text-white'
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Admin section */}
          <div>
            <div className="text-[10px] font-mono font-bold text-[#78716C] uppercase tracking-wider px-3 mb-2 flex items-center justify-between">
              <span>Administração</span>
              {isAdmin && <span className="text-[9px] bg-[#EAE5D9] text-[#57534E] px-1.5 py-0.2 rounded font-mono">Auditor</span>}
            </div>
            <div className="space-y-1">
              {adminItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentView === item.id;
                return (
                  <button
                    key={item.id}
                    id={`sidebar-admin-link-${item.id}`}
                    onClick={() => handleSelect(item.id)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-[#1C1917] text-[#FAF8F5] font-semibold shadow-2xs'
                        : 'text-[#57534E] hover:bg-[#F2ECE0] hover:text-[#1A1A1A]'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-[#FAF8F5]' : 'text-[#78716C]'}`} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="p-4 border-t border-[#EAE6DF] bg-[#FAF8F5]/80">
          <div className="text-[11px] text-[#78716C] font-normal leading-relaxed">
            <span className="font-editorial-heading font-semibold text-[#1C1917]">Fiscal Questões</span>
            <div className="text-[10px] text-[#A8A29E] font-mono mt-0.5">Gabarito Seguro no Servidor</div>
          </div>
        </div>
      </aside>
    </>
  );
};

