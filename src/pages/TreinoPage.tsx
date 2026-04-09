import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Plus, ArrowLeft, ArrowUp, ArrowDown, ChevronDown, Timer } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { format, differenceInCalendarDays } from "date-fns";
import { ptBR } from "date-fns/locale";

// ─── Shared helpers ──────────────────────────────────
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs font-extralight tracking-[0.08em] uppercase text-text-secondary">{label}</Label>
      {children}
    </div>
  );
}

function PillSelect({ options, value, onChange }: { options: { value: string; label: string }[]; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map(o => (
        <button key={o.value} type="button" onClick={() => onChange(o.value)}
          className={`px-3 py-2 text-xs rounded-md border transition-colors ${value === o.value ? "bg-primary text-primary-foreground border-primary" : "border-border text-text-secondary hover:border-border-active"}`}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

function MoreDetails({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button type="button" onClick={() => setOpen(!open)} className="flex items-center gap-1 text-xs text-text-secondary hover:text-primary transition-colors">
        <ChevronDown className={`h-3 w-3 transition-transform ${open ? "rotate-180" : ""}`} /> Mais detalhes
      </button>
      {open && <div className="mt-2 space-y-3">{children}</div>}
    </div>
  );
}

const descansoOptions = [
  { value: "30", label: "30s" }, { value: "45", label: "45s" }, { value: "60", label: "60s" },
  { value: "90", label: "90s" }, { value: "120", label: "2min" }, { value: "180", label: "3min" },
];

const modalidadeCardio = [
  { value: "corrida", label: "Corrida" }, { value: "caminhada", label: "Caminhada" },
  { value: "bike", label: "Bike" }, { value: "eliptico", label: "Elíptico" },
  { value: "pular_corda", label: "Pular corda" }, { value: "outro", label: "Outro" },
];

const intensidadeOptions = [
  { value: "leve", label: "Leve" }, { value: "moderada", label: "Moderada" }, { value: "intensa", label: "Intensa" },
];

const tipoExercicio = [
  { value: "musculacao", label: "Musculação" }, { value: "cardio", label: "Cardio" },
  { value: "funcional", label: "Funcional" }, { value: "flexibilidade", label: "Flexibilidade" },
  { value: "outro", label: "Outro" },
];

const horarioOptions = [
  { value: "manha_jejum", label: "Manhã em jejum" }, { value: "apos_treino", label: "Após treino" },
  { value: "noite", label: "À noite" },
];

// ─── Session Logger ──────────────────────────────────
function SessionLogger({ exercise, userId, onDone }: { exercise: any; userId: string; onDone: () => void }) {
  const numSeries = exercise.series || 3;
  const [sets, setSets] = useState<{ carga: string; reps: string; feito: boolean }[]>(
    Array.from({ length: numSeries }, () => ({ carga: String(exercise.carga_kg || ""), reps: String(exercise.repeticoes || "12"), feito: false }))
  );

  const saveSession = async () => {
    const { error } = await supabase.from("exercise_sessions").insert({
      user_id: userId,
      exercise_id: exercise.id,
      data: format(new Date(), "yyyy-MM-dd"),
      sets_data: sets.map((s, i) => ({ set: i + 1, carga: Number(s.carga) || 0, reps: Number(s.reps) || 0, feito: s.feito })),
    });
    if (error) toast.error(error.message);
    else { toast.success("Sessão registrada!"); onDone(); }
  };

  return (
    <div className="space-y-2 px-4 pb-3">
      {sets.map((s, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="text-xs text-text-muted w-6">S{i + 1}</span>
          <Input type="number" value={s.carga} onChange={e => { const n = [...sets]; n[i].carga = e.target.value; setSets(n); }} placeholder="kg" className="w-16 h-8 text-xs" />
          <Input type="number" value={s.reps} onChange={e => { const n = [...sets]; n[i].reps = e.target.value; setSets(n); }} placeholder="reps" className="w-16 h-8 text-xs" />
          <Checkbox checked={s.feito} onCheckedChange={v => { const n = [...sets]; n[i].feito = !!v; setSets(n); }} className="rounded-full h-4 w-4" />
        </div>
      ))}
      <button onClick={saveSession} className="text-xs px-3 py-1.5 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-opacity">
        Salvar sessão
      </button>
    </div>
  );
}

// ─── MAIN PAGE ──────────────────────────────────────
export default function TreinoPage() {
  const { user } = useAuth();
  const [plans, setPlans] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [exercises, setExercises] = useState<any[]>([]);
  const [streak, setStreak] = useState(0);
  const [peso, setPeso] = useState("");
  const [pesoHorario, setPesoHorario] = useState("manha_jejum");
  const [pesoObs, setPesoObs] = useState("");
  const [pesoHistory, setPesoHistory] = useState<any[]>([]);
  const [todayLog, setTodayLog] = useState<any>(null);
  const [open, setOpen] = useState(false);
  const [planForm, setPlanForm] = useState({ nome: "", dias_semana: [] as string[] });
  const [exForm, setExForm] = useState<any>({ nome: "", tipo: "musculacao", series: "3", repeticoes: "12" });
  const [sessionOpen, setSessionOpen] = useState<string | null>(null);

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
      if (diff <= 1) { count++; checkDate = logDate; } else break;
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

    const payload: any = {
      nome: exForm.nome, tipo: exForm.tipo, plan_id: selected.id,
      user_id: user.id, ordem: exercises.length,
    };

    if (exForm.tipo === "musculacao" || exForm.tipo === "funcional") {
      payload.series = Number(exForm.series);
      payload.repeticoes = Number(exForm.repeticoes);
      payload.carga_kg = exForm.carga_kg ? Number(exForm.carga_kg) : null;
      payload.descanso_segundos = exForm.descanso ? Number(exForm.descanso) : null;
    } else if (exForm.tipo === "cardio") {
      payload.duracao_minutos = Number(exForm.duracao_minutos);
      payload.modalidade_cardio = exForm.modalidade_cardio;
      payload.intensidade = exForm.intensidade;
      payload.distancia_km = exForm.distancia_km ? Number(exForm.distancia_km) : null;
      payload.series = 1;
      payload.repeticoes = 1;
    } else {
      payload.series = Number(exForm.series) || 3;
      payload.repeticoes = Number(exForm.repeticoes) || 12;
    }

    const { error } = await supabase.from("workout_exercises").insert(payload);
    if (error) toast.error(error.message);
    else { setExForm({ nome: "", tipo: "musculacao", series: "3", repeticoes: "12" }); selectPlan(selected); }
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
    const { error } = await supabase.from("body_weight_logs").upsert({
      user_id: user.id, data: format(new Date(), "yyyy-MM-dd"),
      peso: Number(peso), horario: pesoHorario, observacao: pesoObs || null,
    } as any);
    if (error) toast.error(error.message);
    else { toast.success("Peso registrado!"); setPeso(""); setPesoObs(""); loadPeso(); }
  };

  const diasSemana = ["seg", "ter", "qua", "qui", "sex", "sab", "dom"];
  const diasLabels: Record<string, string> = { seg: "SEG", ter: "TER", qua: "QUA", qui: "QUI", sex: "SEX", sab: "SAB", dom: "DOM" };
  const todayDay = format(new Date(), "EEE", { locale: ptBR }).toLowerCase().slice(0, 3);
  const pesoTrend = pesoHistory.length >= 2 ? (pesoHistory[0].peso > pesoHistory[1].peso ? "up" : pesoHistory[0].peso < pesoHistory[1].peso ? "down" : "same") : "same";

  // ─── PLAN DETAIL VIEW ──────────────────────────────
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

        {/* Exercise list */}
        <div>
          {exercises.map(ex => (
            <div key={ex.id} className="border-b border-border">
              <label className="flex items-center gap-3 h-[52px] px-4 cursor-pointer hover:bg-surface-raised transition-colors">
                <Checkbox checked={concluidos.includes(ex.id)} onCheckedChange={() => toggleExercise(ex.id)} className="rounded-full h-5 w-5" />
                <div className={`flex-1 flex items-center gap-2 ${concluidos.includes(ex.id) ? "line-through text-text-muted" : ""}`}>
                  <span className="text-sm">{ex.nome}</span>
                  {ex.tipo === "cardio" ? (
                    <span className="text-xs text-text-secondary">{ex.duracao_minutos}min · {ex.modalidade_cardio || ""}</span>
                  ) : (
                    <span className="text-xs text-text-secondary">{ex.series}×{ex.repeticoes}{ex.carga_kg ? ` · ${ex.carga_kg}kg` : ""}</span>
                  )}
                </div>
                <button type="button" onClick={(e) => { e.preventDefault(); setSessionOpen(sessionOpen === ex.id ? null : ex.id); }}
                  className="text-[10px] px-2 py-1 border border-border rounded text-text-secondary hover:border-primary hover:text-primary transition-colors">
                  Registrar
                </button>
              </label>
              {sessionOpen === ex.id && user && (
                <SessionLogger exercise={ex} userId={user.id} onDone={() => { setSessionOpen(null); selectPlan(selected); }} />
              )}
            </div>
          ))}
        </div>

        {/* Add exercise form */}
        <div className="space-y-3 bg-surface border border-border rounded-md p-4">
          <p className="text-xs font-extralight tracking-[0.08em] uppercase text-text-secondary">Adicionar exercício</p>
          <form onSubmit={addExercise} className="space-y-3">
            <Input value={exForm.nome} onChange={e => setExForm({ ...exForm, nome: e.target.value })} placeholder="Nome do exercício" required />
            <Field label="Tipo"><PillSelect options={tipoExercicio} value={exForm.tipo} onChange={v => setExForm({ ...exForm, tipo: v })} /></Field>

            {(exForm.tipo === "musculacao" || exForm.tipo === "funcional") && (
              <div className="grid grid-cols-2 gap-2">
                <Field label="Séries"><Input type="number" value={exForm.series} onChange={e => setExForm({ ...exForm, series: e.target.value })} /></Field>
                <Field label="Repetições"><Input value={exForm.repeticoes} onChange={e => setExForm({ ...exForm, repeticoes: e.target.value })} placeholder="12 ou 'até falha'" /></Field>
                <MoreDetails>
                  <Field label="Carga (kg)"><Input type="number" step="0.5" value={exForm.carga_kg || ""} onChange={e => setExForm({ ...exForm, carga_kg: e.target.value })} /></Field>
                  <Field label="Descanso"><PillSelect options={descansoOptions} value={exForm.descanso || ""} onChange={v => setExForm({ ...exForm, descanso: v })} /></Field>
                </MoreDetails>
              </div>
            )}

            {exForm.tipo === "cardio" && (
              <div className="space-y-3">
                <Field label="Duração (min)"><Input type="number" value={exForm.duracao_minutos || ""} onChange={e => setExForm({ ...exForm, duracao_minutos: e.target.value })} required /></Field>
                <Field label="Modalidade"><PillSelect options={modalidadeCardio} value={exForm.modalidade_cardio || ""} onChange={v => setExForm({ ...exForm, modalidade_cardio: v })} /></Field>
                <Field label="Intensidade"><PillSelect options={intensidadeOptions} value={exForm.intensidade || ""} onChange={v => setExForm({ ...exForm, intensidade: v })} /></Field>
                <MoreDetails>
                  <Field label="Distância (km)"><Input type="number" step="0.1" value={exForm.distancia_km || ""} onChange={e => setExForm({ ...exForm, distancia_km: e.target.value })} /></Field>
                </MoreDetails>
              </div>
            )}

            <button type="submit" className="h-10 w-full bg-primary text-primary-foreground font-bold text-sm rounded-md hover:opacity-90 transition-opacity">
              <Plus className="h-4 w-4 inline mr-1" /> Adicionar
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ─── PLAN LIST VIEW ──────────────────────────────────
  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Treino</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <button onClick={() => setOpen(true)} className="flex items-center gap-1.5 px-4 h-9 text-sm font-bold bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-opacity">
            <Plus className="h-4 w-4" /> Novo plano
          </button>
          <DialogContent className="bg-surface border-border">
            <DialogHeader><DialogTitle className="font-bold">Novo plano de treino</DialogTitle></DialogHeader>
            <form onSubmit={createPlan} className="space-y-3">
              <Field label="Nome do plano"><Input value={planForm.nome} onChange={e => setPlanForm({ ...planForm, nome: e.target.value })} required placeholder="Ex: Hipertrofia semana 1" /></Field>
              <div className="space-y-1">
                <Label className="text-xs font-extralight tracking-[0.08em] uppercase text-text-secondary">Dias ativos</Label>
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

      {/* Register weight — enhanced */}
      <div className="space-y-2">
        <div className="flex gap-2 items-end">
          <div className="flex-1">
            <label className="text-xs font-extralight tracking-[0.08em] uppercase text-text-secondary">Registrar peso (kg)</label>
            <Input type="number" step="0.1" value={peso} onChange={e => setPeso(e.target.value)} placeholder="Ex: 82.5" className="mt-1" />
          </div>
          <button onClick={salvarPeso} className="h-10 px-4 border border-border text-sm hover:border-primary hover:text-primary transition-colors rounded-md">Salvar</button>
        </div>
        <div className="flex gap-2 items-center">
          <PillSelect options={horarioOptions} value={pesoHorario} onChange={setPesoHorario} />
        </div>
        <Input value={pesoObs} onChange={e => setPesoObs(e.target.value)} placeholder="Observação (opcional)" className="text-sm" />
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

      {/* Weight history sparkline */}
      {pesoHistory.length > 1 && (
        <div className="bg-surface border border-border rounded-md p-4">
          <p className="text-[11px] font-extralight tracking-[0.08em] uppercase text-text-secondary mb-3">Histórico de peso</p>
          <div className="flex items-end gap-1 h-12">
            {pesoHistory.slice(0, 7).reverse().map((p) => {
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
