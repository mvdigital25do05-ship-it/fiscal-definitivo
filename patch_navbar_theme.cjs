const fs = require('fs');
let code = fs.readFileSync('src/components/Navbar.tsx', 'utf8');

// 1. Add Moon, Sun to lucide imports
code = code.replace(/BookX,/, 'BookX, Moon, Sun,');

// 2. Add theme state inside Navbar component
const oldNavbarStart = `export const Navbar: React.FC<Props> = ({
  user,
  onLoginClick,
  onLogoutClick,
  currentView,
  onNavigate,
  totalQuestionsCount,
}) => {
  return (`;

const newNavbarStart = `export const Navbar: React.FC<Props> = ({
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

  return (`;

code = code.replace(oldNavbarStart, newNavbarStart);

// 3. Add the toggle button to the UI.
// Let's place it right before the user area or after the question count area.
const rightAreaStart = `{/* Right user & question count area */}
        <div className="flex items-center gap-3">`;

const rightAreaStartWithTheme = `{/* Right user & question count area */}
        <div className="flex items-center gap-3">
          <button
            onClick={toggleTheme}
            title="Alternar tema"
            className="p-2 text-[#78716C] hover:text-[#1C1917] hover:bg-[#EAE5D9] rounded-lg transition-colors cursor-pointer"
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>`;

code = code.replace(rightAreaStart, rightAreaStartWithTheme);

fs.writeFileSync('src/components/Navbar.tsx', code);
