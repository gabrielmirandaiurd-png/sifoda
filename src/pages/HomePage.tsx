import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Activity, DollarSign, CalendarClock, CheckCircle2 } from "lucide-react";

const today = () => format(new Date(), "yyyy-MM-dd");

interface Checklist {
  id?: string;
  treino_feito: boolean;
  dieta_seguida: boolean;
  uber_batida: boolean;
  tarefa_feita: boolean;
}

const defaultChecklist: Checklist = {
  treino_feito: false,
  dieta_seguida: false,
  uber_batida: false,
  tarefa_feita: false,
};

export default function HomePage() {
  const { user } = useAuth();
  const [checklist, setChecklist] = useState<Checklist>(defaultChecklist);
  const [saldoMes, setSaldoMes] = useState(0);
  const [proximoVencimento, setProximoVencimento] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    loadChecklist();
    loadFinanceSummary();
  }, [user]);

  const loadChecklist = async () => {
    const { data } = await supabase
      .from("daily_checklist")
      .select("*")
      .eq("data", today())
      .maybeSingle();

    if (data) {
      setChecklist(data);
    }
  };

  const loadFinanceSummary = async () => {
    const mesAtual = new Date();
    const inicio = format(new Date(mesAtual.getFullYear(), mesAtual.getMonth(), 1), "yyyy-MM-dd");
    const fim = format(new Date(mesAtual.getFullYear(), mesAtual.getMonth() + 1, 0), "yyyy-MM-dd");

    const [incomeRes, expenseRes, nextExpRes] = await Promise.all([
      supabase.from("income").select("valor").gte("data", inicio).lte("data", fim),
      supabase.from("expenses").select("valor, status").gte("data", inicio).lte("data", fim),
      supabase
        .from("expenses")
        .select("nome, data")
        .eq("status", "pendente")
        .gte("data", today())
        .order("data", { ascending: true })
        .limit(1),
    ]);

    const totalIncome = (incomeRes.data || []).reduce((s, r) => s + Number(r.valor), 0);
    const totalPago = (expenseRes.data || [])
      .filter((e) => e.status === "pago")
      .reduce((s, r) => s + Number(r.valor), 0);
    setSaldoMes(totalIncome - totalPago);

    if (nextExpRes.data?.[0]) {
      const e = nextExpRes.data[0];
      setProximoVencimento(
        `${e.nome} — ${format(new Date(e.data + "T12:00:00"), "dd/MM", { locale: ptBR })}`
      );
    }
  };

  const toggleItem = async (field: keyof Checklist) => {
    if (!user) return;
    const newVal = !checklist[field];
    const updated = { ...checklist, [field]: newVal };
    setChecklist(updated);

    if (checklist.id) {
      await supabase
        .from("daily_checklist")
        .update({ [field]: newVal })
        .eq("id", checklist.id);
    } else {
      const { data } = await supabase
        .from("daily_checklist")
        .insert({ user_id: user.id, data: today(), ...updated })
        .select()
        .single();
      if (data) setChecklist(data);
    }
  };

  const items = [
    { key: "treino_feito" as const, label: "Treino feito", icon: Activity },
    { key: "dieta_seguida" as const, label: "Dieta seguida", icon: CheckCircle2 },
    { key: "uber_batida" as const, label: "Meta Uber batida", icon: DollarSign },
    { key: "tarefa_feita" as const, label: "Tarefa principal feita", icon: CalendarClock },
  ];

  const completedCount = items.filter((i) => checklist[i.key]).length;

  return (
    <div className="space-y-6 max-w-lg mx-auto">
      <div>
        <h1 className="text-2xl font-bold">
          {format(new Date(), "EEEE, dd 'de' MMMM", { locale: ptBR })}
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          {completedCount}/{items.length} concluídos hoje
        </p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Checklist do dia</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {items.map(({ key, label, icon: Icon }) => (
            <label
              key={key}
              className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 cursor-pointer hover:bg-muted transition-colors"
            >
              <Checkbox
                checked={checklist[key]}
                onCheckedChange={() => toggleItem(key)}
              />
              <Icon className="h-4 w-4 text-muted-foreground" />
              <span className={checklist[key] ? "line-through text-muted-foreground" : ""}>
                {label}
              </span>
            </label>
          ))}
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Saldo do mês</p>
            <p className={`text-xl font-bold mt-1 ${saldoMes >= 0 ? "text-accent" : "text-destructive"}`}>
              R$ {saldoMes.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Próximo vencimento</p>
            <p className="text-sm font-medium mt-1">
              {proximoVencimento || "Nenhum pendente"}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
