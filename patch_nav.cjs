const fs = require('fs');

const content = `import React from 'react';
import { User as UserIcon, LogOut, ChevronDown, HelpCircle } from 'lucide-react';
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
}) => {
  return (
    <div className="flex flex-col w-full">
      {/* Top Utility Bar */}
      <div className="bg-[#2f3b4c] text-white flex justify-between items-center px-4 py-1.5 text-xs font-sans">
        <div className="flex items-center gap-1">
          <span className="text-gray-300">Seja bem-vindo,</span>
          {user ? (
            <div className="flex items-center gap-1">
              <UserIcon className="w-3 h-3 text-gray-300" />
              <span className="font-semibold">{user.email}</span>
              <ChevronDown className="w-3 h-3 text-gray-300" />
            </div>
          ) : (
            <button onClick={onLoginClick} className="font-semibold hover:underline cursor-pointer">Fazer Login</button>
          )}
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-gray-300">
            <div className="w-4 h-4 border border-gray-400 rounded-sm flex items-center justify-center cursor-pointer hover:bg-gray-700">
              <span className="text-[10px] font-bold">T</span>
            </div>
            <div className="w-4 h-4 border border-gray-400 rounded-sm flex flex-col items-center justify-center cursor-pointer hover:bg-gray-700 leading-none">
              <span className="text-[8px] h-[6px]">↑</span>
              <span className="text-[8px] h-[6px]">↓</span>
            </div>
            <HelpCircle className="w-4 h-4 cursor-pointer hover:text-white" />
          </div>
          <button className="bg-transparent border border-[#5cb85c] text-[#5cb85c] hover:bg-[#5cb85c] hover:text-white px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer">
            Plano Padrão
          </button>
          {user && (
            <button onClick={onLogoutClick} className="flex items-center gap-1 text-[#d9534f] hover:text-red-300 cursor-pointer">
              <LogOut className="w-3 h-3" />
              <span>Sair</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="bg-[#364758] px-4 pt-3 flex items-end">
        <div className="flex items-center">
          <NavTab label="INÍCIO" isActive={false} onClick={() => {}} />
          <NavTab label="GUIAS" isActive={false} onClick={() => {}} />
          <NavTab label="ESTUDO" isActive={currentView === 'study'} onClick={() => onNavigate('study')} />
          <NavTab label="ESTATÍSTICAS" isActive={currentView === 'errors'} onClick={() => onNavigate('errors')} />
          <NavTab label="CONCURSOS" isActive={currentView === 'disciplines'} onClick={() => onNavigate('disciplines')} />
          <NavTab label="MAIS" isActive={currentView === 'import'} onClick={() => onNavigate('import')} hasDropdown />
        </div>
      </div>
    </div>
  );
};

const NavTab = ({ label, isActive, onClick, hasDropdown }: { label: string, isActive: boolean, onClick: () => void, hasDropdown?: boolean }) => {
  return (
    <button
      onClick={onClick}
      className={\`px-4 py-2.5 text-xs font-semibold tracking-wide flex items-center gap-1 cursor-pointer transition-colors uppercase \${
        isActive 
          ? 'text-[#258bd5] border-b-[3px] border-[#258bd5] bg-[#f4f6f8] rounded-t-sm' 
          : 'text-[#a4b7c6] hover:text-white border-b-[3px] border-transparent'
      }\`}
    >
      {label}
      {hasDropdown && <ChevronDown className="w-3 h-3 opacity-70" />}
    </button>
  );
};
`;

fs.writeFileSync('src/components/Navbar.tsx', content, 'utf8');
console.log('Navbar updated');
