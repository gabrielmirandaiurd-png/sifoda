import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Plus, Flame, Scale, ArrowLeft } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { format, differenceInCalendarDays, subDays } from "date-fns";
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
      ...exForm,
      series: Number(exForm.series),
      repeticoes: Number(exForm.repeticoes),
      plan_id: selected.id,
      user_id: user.id,
      ordem: exercises.length,
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
      await supabase.from("workout_logs").insert({
        user_id: user.id,
        plan_id: selected.id,
        data: format(new Date(), "yyyy-MM-dd"),
        exercicios_concluidos: updated,
      });
    }
    selectPlan(selected);
    loadStreak();
  };

  const salvarPeso = async () => {
    if (!user || !peso) return;
    const { error } = await supabase.from("body_weight_logs").upsert({
      user_id: user.id,
      data: format(new Date(), "yyyy-MM-dd"),
      peso: Number(peso),
    });
    if (error) toast.error(error.message);
    else { toast.success("Peso registrado!"); setPeso(""); loadPeso(); }
  };

  const diasSemana = ["seg", "ter", "qua", "qui", "sex", "sab", "dom"];

  if (selected) {
    const concluidos: string[] = todayLog?.exercicios_concluidos || [];
    return (
      <div className="space-y-6 max-w-lg mx-auto">
        <Button variant="ghost" size="sm" onClick={() => setSelected(null)} className="gap-1"><ArrowLeft className="h-4 w-4" /> Voltar</Button>
        <h1 className="text-2xl font-bold">{selected.nome}</h1>

        <div className="space-y-2">
          {exercises.map(ex => (
            <label key={ex.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 cursor-pointer">
              <Checkbox checked={concluidos.includes(ex.id)} onCheckedChange={() => toggleExercise(ex.id)} />
              <div className={concluidos.includes(ex.id) ? "line-through text-muted-foreground" : ""}>
                <span className="font-medium">{ex.nome}</span>
                <span className="text-xs text-muted-foreground ml-2">{ex.series}×{ex.repeticoes}</span>
              </div>
            </label>
          ))}
        </div>

        <form onSubmit={addExercise} className="flex gap-2 flex-wrap">
          <Input value={exForm.nome} onChange={e => setExForm({ ...exForm, nome: e.target.value })} placeholder="Exercício" required className="flex-1 min-w-[120px]" />
          <Input value={exForm.series} onChange={e => setExForm({ ...exForm, series: e.target.value })} type="number" className="w-16" placeholder="Séries" />
          <Input value={exForm.repeticoes} onChange={e => setExForm({ ...exForm, repeticoes: e.target.value })} type="number" className="w-16" placeholder="Reps" />
          <Button type="submit" size="icon"><Plus className="h-4 w-4" /></Button>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-lg mx-auto">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Treino</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button size="sm" className="gap-1"><Plus className="h-4 w-4" /> Novo plano</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Novo plano de treino</DialogTitle></DialogHeader>
            <form onSubmit={createPlan} className="space-y-3">
              <div className="space-y-1"><Label>Nome</Label><Input value={planForm.nome} onChange={e => setPlanForm({ ...planForm, nome: e.target.value })} required /></div>
              <div className="space-y-1">
                <Label>Dias da semana</Label>
                <div className="flex flex-wrap gap-2">
                  {diasSemana.map(d => (
                    <button key={d} type="button" onClick={() => {
                      const ds = planForm.dias_semana.includes(d) ? planForm.dias_semana.filter(x => x !== d) : [...planForm.dias_semana, d];
                      setPlanForm({ ...planForm, dias_semana: ds });
                    }} className={`px-3 py-1 rounded-full text-xs font-medium border ${planForm.dias_semana.includes(d) ? "bg-primary text-primary-foreground border-primary" : "border-input"}`}>
                      {d}
                    </button>
                  ))}
                </div>
              </div>
              <Button type="submit" className="w-full">Criar</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-5 flex items-center gap-3">
            <Flame className="h-8 w-8 text-orange-500" />
            <div>
              <p className="text-2xl font-bold">{streak}</p>
              <p className="text-xs text-muted-foreground">dias seguidos</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 flex items-center gap-3">
            <Scale className="h-8 w-8 text-primary" />
            <div>
              <p className="text-2xl font-bold">{pesoHistory[0]?.peso || "—"}</p>
              <p className="text-xs text-muted-foreground">kg atual</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">Registrar peso</CardTitle></CardHeader>
        <CardContent className="flex gap-2">
          <Input type="number" step="0.1" value={peso} onChange={e => setPeso(e.target.value)} placeholder="Peso (kg)" />
          <Button onClick={salvarPeso}>Salvar</Button>
        </CardContent>
      </Card>

      {plans.length === 0 ? (
        <p className="text-muted-foreground text-sm text-center py-8">Nenhum plano de treino.</p>
      ) : (
        <div className="space-y-2">
          {plans.map(p => (
            <Card key={p.id} className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => selectPlan(p)}>
              <CardContent className="py-3 px-4">
                <p className="font-medium">{p.nome}</p>
                <p className="text-xs text-muted-foreground mt-1">{(p.dias_semana || []).join(", ")}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {pesoHistory.length > 1 && (
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base">Histórico de peso</CardTitle></CardHeader>
          <CardContent className="space-y-1">
            {pesoHistory.slice(0, 10).map(p => (
              <div key={p.id} className="flex justify-between text-sm">
                <span>{format(new Date(p.data + "T12:00:00"), "dd/MM/yyyy")}</span>
                <span className="font-medium">{p.peso} kg</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
