import { Link, useLocation } from "react-router-dom";
import {
  Home,
  DollarSign,
  FolderKanban,
  ListChecks,
  Dumbbell,
  Apple,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/", icon: Home, label: "Início" },
  { to: "/financeiro", icon: DollarSign, label: "Financeiro" },
  { to: "/projetos", icon: FolderKanban, label: "Projetos" },
  { to: "/tarefas", icon: ListChecks, label: "Tarefas" },
  { to: "/treino", icon: Dumbbell, label: "Treino" },
  { to: "/dieta", icon: Apple, label: "Dieta" },
];

export default function BottomNav() {
  const { pathname } = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-surface md:hidden">
      <div className="flex items-center justify-around h-[60px] px-1">
        {navItems.map(({ to, icon: Icon, label }) => {
          const active = to === "/" ? pathname === "/" : pathname.startsWith(to);
          return (
            <Link
              key={to}
              to={to}
              className={cn(
                "flex flex-col items-center gap-0.5 px-2 py-1 text-[11px] font-extralight tracking-wider uppercase transition-colors",
                active
                  ? "text-primary"
                  : "text-text-secondary"
              )}
            >
              <Icon className={cn("h-5 w-5", active ? "text-primary" : "text-text-secondary")} />
              {label}
              {active && <span className="w-1 h-1 rounded-full bg-primary mt-0.5" />}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
