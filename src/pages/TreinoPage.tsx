import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Plus, ArrowLeft, ArrowUp, ArrowDown } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { format, differenceInCalendarDays } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function TreinoPage() {
  const { user } = useAuth();
  const [plans, setPlans] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [exercises, setExercises] = useState<any[]>([]);
  const [streak, setStreak] = useState(0);
  const [peso, setPeso] = useState("");
  const [pesoHistory, setPesoHistory] = useState<any[]>([]);
  const [todayLog, setTodayLog] = useState<any>(null);
  const [open, setOpen] = useState(false);
  const [planForm, setPlanForm] = useState({ nome: "", dias_semana: [] as string[] });
  const [exForm, setExForm] = useState({ nome: "", series: "3", repeticoes: "12" });

  useEffect(() => { if (user) { loadPlans(); loadStreak(); loadPeso(); } }, [user]);

  const loadPlans = async () => {
    const { data } = await supabase.from("workout_plans").select("*").order("created_at");
    setPlans(data || []);
  };

  const loadStreak = async () => {
    const { data } = await supabase.from("workout_logs").select("data").order("data", { ascending: false }).limit(60);
    if (!data || data.length === 0) { setStreak(0); return; }
    let count = 0;
    let checkDate = new Date();
    for (const log of data) {
      const logDate = new Date(log.data + "T12:00:00");
      const diff = differenceInCalendarDays(checkDate, logDate);
      if (diff <= 1) { count++; checkDate = logDate; }
      else break;
    }
    setStreak(count);
  };

  const loadPeso = async () => {
    const { data } = await supabase.from("body_weight_logs").select("*").order("data", { ascending: false }).limit(30);
    setPesoHistory(data || []);
  };

  const selectPlan = async (plan: any) => {
    setSelected(plan);
    const [exRes, logRes] = await Promise.all([
      supabase.from("workout_exercises").select("*").eq("plan_id", plan.id).order("ordem"),
      supabase.from("workout_logs").select("*").eq("data", format(new Date(), "yyyy-MM-dd")).maybeSingle(),
    ]);
    setExercises(exRes.data || []);
    setTodayLog(logRes.data);
  };

  const createPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const { error } = await supabase.from("workout_plans").insert({ ...planForm, user_id: user.id });
    if (error) toast.error(error.message);
    else { toast.success("Plano criado!"); setPlanForm({ nome: "", dias_semana: [] }); setOpen(false); loadPlans(); }
  };

  const addExercise = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selected) return;
    const { error } = await supabase.from("workout_exercises").insert({
      ...exForm, series: Number(exForm.series), repeticoes: Number(exForm.repeticoes),
      plan_id: selected.id, user_id: user.id, ordem: exercises.length,
    });
    if (error) toast.error(error.message);
    else { setExForm({ nome: "", series: "3", repeticoes: "12" }); selectPlan(selected); }
  };

  const toggleExercise = async (exId: string) => {
    if (!user || !selected) return;
    const current: string[] = todayLog?.exercicios_concluidos || [];
    const updated = current.includes(exId) ? current.filter(id => id !== exId) : [...current, exId];
    if (todayLog) {
      await supabase.from("workout_logs").update({ exercicios_concluidos: updated }).eq("id", todayLog.id);
    } else {
      await supabase.from("workout_logs").insert({ user_id: user.id, plan_id: selected.id, data: format(new Date(), "yyyy-MM-dd"), exercicios_concluidos: updated });
    }
    selectPlan(selected);
    loadStreak();
  };

  const salvarPeso = async () => {
    if (!user || !peso) return;
    const { error } = await supabase.from("body_weight_logs").upsert({ user_id: user.id, data: format(new Date(), "yyyy-MM-dd"), peso: Number(peso) });
    if (error) toast.error(error.message);
    else { toast.success("Peso registrado!"); setPeso(""); loadPeso(); }
  };

  const diasSemana = ["seg", "ter", "qua", "qui", "sex", "sab", "dom"];
  const diasLabels: Record<string, string> = { seg: "SEG", ter: "TER", qua: "QUA", qui: "QUI", sex: "SEX", sab: "SAB", dom: "DOM" };
  const todayDay = format(new Date(), "EEE", { locale: ptBR }).toLowerCase().slice(0, 3);

  const pesoTrend = pesoHistory.length >= 2 ? (pesoHistory[0].peso > pesoHistory[1].peso ? "up" : pesoHistory[0].peso < pesoHistory[1].peso ? "down" : "same") : "same";

  if (selected) {
    const concluidos: string[] = todayLog?.exercicios_concluidos || [];
    return (
      <div className="space-y-6 max-w-2xl mx-auto">
        <button onClick={() => setSelected(null)} className="flex items-center gap-1 text-sm text-text-secondary hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" /> Voltar
        </button>
        <h1 className="text-2xl font-bold">{selected.nome}</h1>

        {/* Day pills */}
        <div className="flex gap-2">
          {diasSemana.map(d => {
            const isTrainingDay = (selected.dias_semana || []).includes(d);
            const isToday = d === todayDay;
            return (
              <span key={d} className={`px-3 py-1.5 text-[11px] font-extralight tracking-[0.08em] uppercase rounded-sm border ${isTrainingDay ? "bg-primary/10 border-primary text-primary" : "border-border text-text-muted"} ${isToday ? "ring-1 ring-primary" : ""}`}>
                {diasLabels[d]}
              </span>
            );
          })}
        </div>

        <div>
          {exercises.map(ex => (
            <label key={ex.id} className="flex items-center gap-3 h-[52px] px-4 border-b border-border cursor-pointer hover:bg-surface-raised transition-colors">
              <Checkbox checked={concluidos.includes(ex.id)} onCheckedChange={() => toggleExercise(ex.id)} className="rounded-full h-5 w-5" />
              <div className={`flex-1 flex items-center gap-2 ${concluidos.includes(ex.id) ? "line-through text-text-muted" : ""}`}>
                <span className="text-sm">{ex.nome}</span>
                <span className="text-xs text-text-secondary">{ex.series}×{ex.repeticoes}</span>
              </div>
            </label>
          ))}
        </div>

        <form onSubmit={addExercise} className="flex gap-2 flex-wrap">
          <Input value={exForm.nome} onChange={e => setExForm({ ...exForm, nome: e.target.value })} placeholder="Exercício" required className="flex-1 min-w-[120px]" />
          <Input value={exForm.series} onChange={e => setExForm({ ...exForm, series: e.target.value })} type="number" className="w-16" placeholder="Séries" />
          <Input value={exForm.repeticoes} onChange={e => setExForm({ ...exForm, repeticoes: e.target.value })} type="number" className="w-16" placeholder="Reps" />
          <button type="submit" className="h-10 w-10 flex items-center justify-center border border-border text-text-secondary hover:border-primary hover:text-primary transition-colors rounded-md">
            <Plus className="h-4 w-4" />
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Treino</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <button className="flex items-center gap-1.5 px-4 h-9 text-sm font-bold bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-opacity">
              <Plus className="h-4 w-4" /> Novo plano
            </button>
          </DialogTrigger>
          <DialogContent className="bg-surface border-border">
            <DialogHeader><DialogTitle className="font-bold">Novo plano de treino</DialogTitle></DialogHeader>
            <form onSubmit={createPlan} className="space-y-3">
              <div className="space-y-1"><Label className="text-xs font-extralight tracking-[0.08em] uppercase text-text-secondary">Nome</Label><Input value={planForm.nome} onChange={e => setPlanForm({ ...planForm, nome: e.target.value })} required /></div>
              <div className="space-y-1">
                <Label className="text-xs font-extralight tracking-[0.08em] uppercase text-text-secondary">Dias da semana</Label>
                <div className="flex flex-wrap gap-2">
                  {diasSemana.map(d => (
                    <button key={d} type="button" onClick={() => {
                      const ds = planForm.dias_semana.includes(d) ? planForm.dias_semana.filter(x => x !== d) : [...planForm.dias_semana, d];
                      setPlanForm({ ...planForm, dias_semana: ds });
                    }} className={`px-3 py-1.5 text-xs rounded-sm border transition-colors ${planForm.dias_semana.includes(d) ? "bg-primary text-primary-foreground border-primary" : "border-border text-text-secondary hover:border-primary"}`}>
                      {diasLabels[d]}
                    </button>
                  ))}
                </div>
              </div>
              <button type="submit" className="w-full h-10 bg-primary text-primary-foreground font-bold text-sm rounded-md hover:opacity-90 transition-opacity">Criar</button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-surface border border-border rounded-md p-4">
          <p className="text-[11px] font-extralight tracking-[0.08em] uppercase text-text-secondary">Dias seguidos</p>
          <p className="text-5xl font-black mt-1 text-primary">{streak}</p>
        </div>
        <div className="bg-surface border border-border rounded-md p-4">
          <p className="text-[11px] font-extralight tracking-[0.08em] uppercase text-text-secondary">Peso atual</p>
          <div className="flex items-end gap-2 mt-1">
            <p className="text-5xl font-black">{pesoHistory[0]?.peso || "—"}</p>
            <span className="text-sm text-text-secondary mb-2">kg</span>
            {pesoTrend !== "same" && (
              pesoTrend === "up" ? <ArrowUp className="h-4 w-4 text-destructive mb-2" /> : <ArrowDown className="h-4 w-4 text-success mb-2" />
            )}
          </div>
        </div>
      </div>

      {/* Register weight inline */}
      <div className="flex gap-2 items-end">
        <div className="flex-1">
          <label className="text-xs font-extralight tracking-[0.08em] uppercase text-text-secondary">Registrar peso (kg)</label>
          <Input type="number" step="0.1" value={peso} onChange={e => setPeso(e.target.value)} placeholder="Ex: 82.5" className="mt-1" />
        </div>
        <button onClick={salvarPeso} className="h-10 px-4 border border-border text-sm hover:border-primary hover:text-primary transition-colors rounded-md">Salvar</button>
      </div>

      {/* Plans */}
      {plans.length === 0 ? (
        <p className="text-text-secondary text-sm text-center py-8">Nenhum plano de treino.</p>
      ) : (
        <div className="bg-surface border border-border rounded-md">
          {plans.map(p => (
            <div key={p.id} onClick={() => selectPlan(p)} className="flex items-center justify-between px-4 h-14 border-b border-border last:border-b-0 cursor-pointer hover:bg-surface-raised transition-colors">
              <div>
                <p className="text-sm font-bold">{p.nome}</p>
                <p className="text-xs text-text-secondary">{(p.dias_semana || []).map((d: string) => diasLabels[d] || d).join(", ")}</p>
              </div>
              <ArrowLeft className="h-4 w-4 text-text-muted rotate-180" />
            </div>
          ))}
        </div>
      )}

      {/* Weight history sparkline approximation */}
      {pesoHistory.length > 1 && (
        <div className="bg-surface border border-border rounded-md p-4">
          <p className="text-[11px] font-extralight tracking-[0.08em] uppercase text-text-secondary mb-3">Histórico de peso</p>
          <div className="flex items-end gap-1 h-12">
            {pesoHistory.slice(0, 7).reverse().map((p, i) => {
              const min = Math.min(...pesoHistory.slice(0, 7).map((x: any) => x.peso));
              const max = Math.max(...pesoHistory.slice(0, 7).map((x: any) => x.peso));
              const range = max - min || 1;
              const height = ((p.peso - min) / range) * 100;
              return (
                <div key={p.id} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full bg-primary/20 rounded-sm overflow-hidden" style={{ height: `${Math.max(height, 10)}%` }}>
                    <div className="w-full h-full bg-primary rounded-sm" />
                  </div>
                  <span className="text-[9px] text-text-muted">{p.peso}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
