import { Link, useLocation } from "react-router-dom";
import {
  Home,
  DollarSign,
  FolderKanban,
  ListChecks,
  Dumbbell,
  Apple,
  CheckCircle2,
  Moon,
  Sun,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";

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
    <aside className="hidden md:flex md:flex-col md:w-64 border-r bg-card h-screen sticky top-0">
      <div className="flex items-center gap-2 px-6 py-5 border-b">
        <CheckCircle2 className="h-7 w-7 text-primary" />
        <span className="text-xl font-bold tracking-tight">TáPago</span>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ to, icon: Icon, label }) => {
          const active = to === "/" ? pathname === "/" : pathname.startsWith(to);
          return (
            <Link
              key={to}
              to={to}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                active
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon className="h-5 w-5" />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="px-3 py-4 border-t space-y-2">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-3"
          onClick={toggleTheme}
        >
          {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          {theme === "dark" ? "Modo claro" : "Modo escuro"}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-3 text-destructive hover:text-destructive"
          onClick={signOut}
        >
          <LogOut className="h-4 w-4" />
          Sair
        </Button>
      </div>
    </aside>
  );
}
