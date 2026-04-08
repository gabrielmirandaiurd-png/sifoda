import { Moon, Sun, LogOut } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/contexts/AuthContext";

export default function MobileHeader() {
  const { theme, toggleTheme } = useTheme();
  const { signOut } = useAuth();

  return (
    <header className="sticky top-0 z-40 flex items-center justify-between px-4 py-3 border-b border-border bg-surface md:hidden">
      <span className="text-base font-black tracking-[0.15em] text-primary">
        SIFODA
      </span>
      <div className="flex items-center gap-1">
        <button onClick={toggleTheme} className="p-2 text-text-secondary hover:text-foreground transition-colors">
          {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </button>
        <button onClick={signOut} className="p-2 text-destructive hover:text-destructive/80 transition-colors">
          <LogOut className="h-5 w-5" />
        </button>
      </div>
    </header>
  );
}
