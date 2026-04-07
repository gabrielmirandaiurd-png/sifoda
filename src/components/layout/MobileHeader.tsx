import { CheckCircle2, Moon, Sun, LogOut } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";

export default function MobileHeader() {
  const { theme, toggleTheme } = useTheme();
  const { signOut } = useAuth();

  return (
    <header className="sticky top-0 z-40 flex items-center justify-between px-4 py-3 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80 md:hidden">
      <div className="flex items-center gap-2">
        <CheckCircle2 className="h-6 w-6 text-primary" />
        <span className="text-lg font-bold tracking-tight">TáPago</span>
      </div>
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" onClick={toggleTheme}>
          {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </Button>
        <Button variant="ghost" size="icon" onClick={signOut}>
          <LogOut className="h-5 w-5" />
        </Button>
      </div>
    </header>
  );
}
