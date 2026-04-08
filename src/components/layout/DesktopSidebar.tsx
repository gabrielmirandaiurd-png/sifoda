import { Link, useLocation } from "react-router-dom";
import {
  Home,
  DollarSign,
  FolderKanban,
  ListChecks,
  Dumbbell,
  Apple,
  Moon,
  Sun,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/contexts/AuthContext";

const navItems = [
  { to: "/", icon: Home, label: "Início" },
  { to: "/financeiro", icon: DollarSign, label: "Financeiro" },
  { to: "/projetos", icon: FolderKanban, label: "Projetos" },
  { to: "/tarefas", icon: ListChecks, label: "Tarefas" },
  { to: "/treino", icon: Dumbbell, label: "Treino" },
  { to: "/dieta", icon: Apple, label: "Dieta" },
];

export default function DesktopSidebar() {
  const { pathname } = useLocation();
  const { theme, toggleTheme } = useTheme();
  const { signOut } = useAuth();

  return (
    <aside className="hidden md:flex md:flex-col w-[220px] border-r border-border bg-surface h-screen sticky top-0">
      <div className="px-6 py-6">
        <span className="text-xl font-black tracking-[0.15em] text-primary">
          SIFODA
        </span>
      </div>

      <nav className="flex-1 px-3 py-2 space-y-0.5">
        {navItems.map(({ to, icon: Icon, label }) => {
          const active = to === "/" ? pathname === "/" : pathname.startsWith(to);
          return (
            <Link
              key={to}
              to={to}
              className={cn(
                "flex items-center gap-3 h-11 px-4 text-sm font-normal transition-colors rounded-md",
                active
                  ? "bg-surface-raised text-foreground border-l-2 border-primary"
                  : "text-text-secondary hover:text-foreground"
              )}
            >
              <Icon className={cn("h-4 w-4", active ? "text-primary" : "text-text-secondary")} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="px-3 py-4 border-t border-border space-y-0.5">
        <button
          onClick={toggleTheme}
          className="flex items-center gap-3 h-11 px-4 w-full text-sm text-text-secondary hover:text-foreground transition-colors rounded-md"
        >
          {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          {theme === "dark" ? "Modo claro" : "Modo escuro"}
        </button>
        <button
          onClick={signOut}
          className="flex items-center gap-3 h-11 px-4 w-full text-sm text-destructive hover:text-destructive/80 transition-colors rounded-md"
        >
          <LogOut className="h-4 w-4" />
          Sair
        </button>
      </div>
    </aside>
  );
}
