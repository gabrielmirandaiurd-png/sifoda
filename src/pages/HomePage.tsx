import { useEffect, useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { format, startOfWeek, addDays, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Check, Minus } from "lucide-react";

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
  const [totalPendente, setTotalPendente] = useState(0);
  const [uberSemana, setUberSemana] = useState(0);
  const [uberMeta, setUberMeta] = useState(375);
  const [proximoVencimento, setProximoVencimento] = useState<string | null>(null);
  const [alertas, setAlertas] = useState<any[]>([]);
  const [weekData, setWeekData] = useState<Record<string, { total: number; done: number }>>({});
  const [profileName, setProfileName] = useState("Gabriel");

  useEffect(() => {
    if (!user) return;
    loadChecklist();
    loadFinanceSummary();
    loadWeekData();
    loadProfile();
  }, [user]);

  const loadProfile = async () => {
    const { data } = await supabase.from("profiles").select("nome").eq("id", user!.id).maybeSingle();
    if (data?.nome) setProfileName(data.nome);
  };

  const loadChecklist = async () => {
    const { data } = await supabase.from("daily_checklist").select("*").eq("data", today()).maybeSingle();
    if (data) setChecklist(data);
  };

  const loadFinanceSummary = async () => {
    const mesAtual = new Date();
    const inicio = format(new Date(mesAtual.getFullYear(), mesAtual.getMonth(), 1), "yyyy-MM-dd");
    const fim = format(new Date(mesAtual.getFullYear(), mesAtual.getMonth() + 1, 0), "yyyy-MM-dd");

    const weekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd");
    const weekEnd = format(addDays(startOfWeek(new Date(), { weekStartsOn: 1 }), 6), "yyyy-MM-dd");

    const [incomeRes, expenseRes, nextExpRes, uberLogRes, uberGoalRes] = await Promise.all([
      supabase.from("income").select("valor").gte("data", inicio).lte("data", fim),
      supabase.from("expenses").select("valor, status, nome, data").gte("data", inicio).lte("data", fim),
      supabase.from("expenses").select("nome, data").eq("status", "pendente").gte("data", today()).order("data", { ascending: true }).limit(1),
      supabase.from("uber_daily_log").select("valor").gte("data", weekStart).lte("data", weekEnd),
      supabase.from("uber_goals").select("meta_semanal").maybeSingle(),
    ]);

    const totalIncome = (incomeRes.data || []).reduce((s, r) => s + Number(r.valor), 0);
    const totalPago = (expenseRes.data || []).filter((e) => e.status === "pago").reduce((s, r) => s + Number(r.valor), 0);
    const pendente = (expenseRes.data || []).filter((e) => e.status !== "pago").reduce((s, r) => s + Number(r.valor), 0);
    setSaldoMes(totalIncome - totalPago);
    setTotalPendente(pendente);

    const uberWeekTotal = (uberLogRes.data || []).reduce((s, r) => s + Number(r.valor), 0);
    setUberSemana(uberWeekTotal);
    if (uberGoalRes.data?.meta_semanal) setUberMeta(Number(uberGoalRes.data.meta_semanal));

    if (nextExpRes.data?.[0]) {
      const e = nextExpRes.data[0];
      setProximoVencimento(`${e.nome} — ${format(new Date(e.data + "T12:00:00"), "dd/MM", { locale: ptBR })}`);
    }

    const overdue = (expenseRes.data || []).filter(e => e.status === "atrasado");
    setAlertas(overdue.slice(0, 5));
  };

  const loadWeekData = async () => {
    const start = startOfWeek(new Date(), { weekStartsOn: 1 });
    const dates = Array.from({ length: 7 }, (_, i) => format(addDays(start, i), "yyyy-MM-dd"));
    const { data } = await supabase.from("daily_checklist").select("data, treino_feito, dieta_seguida, uber_batida, tarefa_feita").in("data", dates);
    
    const map: Record<string, { total: number; done: number }> = {};
    dates.forEach(d => { map[d] = { total: 4, done: 0 }; });
    (data || []).forEach(row => {
      const done = [row.treino_feito, row.dieta_seguida, row.uber_batida, row.tarefa_feita].filter(Boolean).length;
      map[row.data] = { total: 4, done };
    });
    setWeekData(map);
  };

  const toggleItem = async (field: keyof Checklist) => {
    if (!user) return;
    const newVal = !checklist[field];
    const updated = { ...checklist, [field]: newVal };
    setChecklist(updated);

    if (checklist.id) {
      await supabase.from("daily_checklist").update({
        treino_feito: updated.treino_feito,
        dieta_seguida: updated.dieta_seguida,
        uber_batida: updated.uber_batida,
        tarefa_feita: updated.tarefa_feita,
      }).eq("id", checklist.id);
    } else {
      const { data } = await supabase.from("daily_checklist").insert({
        user_id: user.id,
        data: today(),
        treino_feito: updated.treino_feito,
        dieta_seguida: updated.dieta_seguida,
        uber_batida: updated.uber_batida,
        tarefa_feita: updated.tarefa_feita,
      }).select().single();
      if (data) setChecklist(data);
    }
  };

  const items = [
    { key: "treino_feito" as const, label: "Treino feito" },
    { key: "dieta_seguida" as const, label: "Dieta seguida" },
    { key: "uber_batida" as const, label: "Meta Uber batida" },
    { key: "tarefa_feita" as const, label: "Tarefa principal feita" },
  ];

  const completedCount = items.filter((i) => checklist[i.key]).length;
  const uberPercent = uberMeta > 0 ? Math.min((uberSemana / uberMeta) * 100, 100) : 0;
  const statusPills = [
    { label: "TREINO", done: checklist.treino_feito },
    { label: "DIETA", done: checklist.dieta_seguida },
    { label: "UBER", done: checklist.uber_batida },
  ];

  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = addDays(weekStart, i);
    return { date: format(d, "yyyy-MM-dd"), label: format(d, "EEE", { locale: ptBR }).toUpperCase().slice(0, 3) };
  });

  const hora = new Date().getHours();
  const saudacao = hora < 12 ? "Bom dia" : hora < 18 ? "Boa tarde" : "Boa noite";

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* TOP BAR */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">{saudacao}, {profileName}.</h1>
          <p className="text-xs font-extralight tracking-[0.08em] uppercase text-text-secondary mt-1">
            {format(new Date(), "EEEE, dd 'de' MMMM", { locale: ptBR })}
          </p>
        </div>
        <div className="flex gap-2">
          {statusPills.map(p => (
            <span
              key={p.label}
              className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extralight tracking-[0.08em] uppercase border border-border"
            >
              {p.label}
              {p.done ? <Check className="h-3 w-3 text-success" /> : <Minus className="h-3 w-3 text-text-muted" />}
            </span>
          ))}
        </div>
      </div>

      {/* METRIC STRIP */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-surface border border-border rounded-md p-4">
          <p className="text-[11px] font-extralight tracking-[0.08em] uppercase text-text-secondary">Saldo do mês</p>
          <p className={`text-3xl font-black mt-1 ${saldoMes >= 0 ? "text-success" : "text-destructive"}`}>
            R$ {saldoMes.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </p>
        </div>
        <div className="bg-surface border border-border rounded-md p-4">
          <p className="text-[11px] font-extralight tracking-[0.08em] uppercase text-text-secondary">Pendente</p>
          <p className="text-3xl font-black mt-1 text-warning">
            R$ {totalPendente.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </p>
        </div>
        <div className="bg-surface border border-border rounded-md p-4">
          <p className="text-[11px] font-extralight tracking-[0.08em] uppercase text-text-secondary">Uber esta semana</p>
          <p className="text-3xl font-black mt-1">
            R$ {uberSemana.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </p>
          <div className="mt-2 h-1 bg-border rounded-sm overflow-hidden">
            <div className="h-full bg-primary rounded-sm transition-all" style={{ width: `${uberPercent}%` }} />
          </div>
        </div>
        <div className="bg-surface border border-border rounded-md p-4">
          <p className="text-[11px] font-extralight tracking-[0.08em] uppercase text-text-secondary">Próximo vencimento</p>
          <p className="text-sm font-bold mt-2">{proximoVencimento || "Nenhum pendente"}</p>
        </div>
      </div>

      {/* CHECKLIST + ALERTS */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="md:col-span-3 bg-surface border border-border rounded-md">
          <div className="p-4 border-b border-border">
            <p className="text-[11px] font-extralight tracking-[0.08em] uppercase text-text-secondary mb-2">Checklist do dia</p>
            <div className="h-1 bg-border rounded-sm overflow-hidden">
              <div className="h-full bg-primary rounded-sm transition-all" style={{ width: `${(completedCount / 4) * 100}%` }} />
            </div>
          </div>
          <div>
            {items.map(({ key, label }) => (
              <label
                key={key}
                className="flex items-center gap-3 h-[52px] px-4 border-b border-border last:border-b-0 cursor-pointer hover:bg-surface-raised transition-colors"
              >
                <Checkbox
                  checked={checklist[key]}
                  onCheckedChange={() => toggleItem(key)}
                  className="rounded-full h-5 w-5"
                />
                <span className={`text-base font-normal ${checklist[key] ? "line-through text-text-muted" : ""}`}>
                  {label}
                </span>
              </label>
            ))}
          </div>
        </div>

        <div className="md:col-span-2 bg-surface border border-border rounded-md p-4">
          <p className="text-[11px] font-extralight tracking-[0.08em] uppercase text-text-secondary mb-3">Alertas críticos</p>
          {alertas.length === 0 ? (
            <div className="flex items-center gap-2 text-success">
              <Check className="h-4 w-4" />
              <span className="text-sm">Tudo em ordem</span>
            </div>
          ) : (
            <div className="space-y-2">
              {alertas.map((a, i) => (
                <div key={i} className="border-l-[3px] border-destructive pl-3 py-2">
                  <p className="text-[11px] font-extralight tracking-[0.08em] uppercase text-text-secondary">{a.nome}</p>
                  <p className="text-sm font-bold text-destructive">
                    R$ {Number(a.valor).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* WEEK STRIP */}
      <div className="flex justify-between gap-2">
        {weekDays.map(({ date, label }) => {
          const isToday = date === today();
          const wd = weekData[date];
          const dotColor = !wd || wd.done === 0 ? "bg-text-muted" : wd.done === 4 ? "bg-success" : "bg-warning";
          return (
            <div
              key={date}
              className={`flex-1 flex flex-col items-center gap-1.5 py-3 rounded-md ${isToday ? "bg-surface-raised border border-primary" : ""}`}
            >
              <span className="text-[11px] font-extralight tracking-[0.08em] uppercase text-text-secondary">{label}</span>
              <span className={`w-2 h-2 rounded-full ${isToday ? "bg-primary" : dotColor}`} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
