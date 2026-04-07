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
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80 md:hidden">
      <div className="flex items-center justify-around h-16 px-1">
        {navItems.map(({ to, icon: Icon, label }) => {
          const active = to === "/" ? pathname === "/" : pathname.startsWith(to);
          return (
            <Link
              key={to}
              to={to}
              className={cn(
                "flex flex-col items-center gap-0.5 px-2 py-1 text-[11px] font-medium transition-colors rounded-lg",
                active
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className={cn("h-5 w-5", active && "text-primary")} />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
