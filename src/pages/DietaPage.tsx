import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Plus, Trash2, ChevronDown, ChevronUp, Circle, Square, Triangle, Diamond } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";

const refeicoes = [
  { value: "cafe", label: "Café da manhã", Icon: Circle },
  { value: "almoco", label: "Almoço", Icon: Square },
  { value: "lanche", label: "Lanche", Icon: Triangle },
  { value: "jantar", label: "Jantar", Icon: Diamond },
];

export default function DietaPage() {
  const { user } = useAuth();
  const [plans, setPlans] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [obs, setObs] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ refeicao: "cafe", descricao: "" });
  const [expandedMeals, setExpandedMeals] = useState<Record<string, boolean>>({});
  const [pesoHistory, setPesoHistory] = useState<any[]>([]);

  const today = format(new Date(), "yyyy-MM-dd");

  useEffect(() => { if (user) loadAll(); }, [user]);

  const loadAll = async () => {
    const [planRes, logRes, pesoRes] = await Promise.all([
      supabase.from("meal_plans").select("*").order("created_at"),
      supabase.from("meal_logs").select("*").eq("data", today),
      supabase.from("body_weight_logs").select("*").order("data", { ascending: false }).limit(7),
    ]);
    setPlans(planRes.data || []);
    setLogs(logRes.data || []);
    setPesoHistory(pesoRes.data || []);
    const obsLog = logRes.data?.find(l => l.observacao);
    if (obsLog) setObs(obsLog.observacao);
  };

  const addPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const { error } = await supabase.from("meal_plans").insert({ ...form, user_id: user.id });
    if (error) toast.error(error.message);
    else { toast.success("Plano adicionado!"); setForm({ refeicao: "cafe", descricao: "" }); setOpen(false); loadAll(); }
  };

  const deletePlan = async (id: string) => {
    await supabase.from("meal_plans").delete().eq("id", id);
    loadAll();
  };

  const toggleRefeicao = async (refeicao: string) => {
    if (!user) return;
    const existing = logs.find(l => l.refeicao === refeicao);
    if (existing) {
      await supabase.from("meal_logs").update({ concluida: !existing.concluida }).eq("id", existing.id);
    } else {
      await supabase.from("meal_logs").insert({ user_id: user.id, data: today, refeicao, concluida: true });
    }
    loadAll();
  };

  const salvarObs = async () => {
    if (!user) return;
    const existing = logs.find(l => l.observacao !== null && l.observacao !== undefined);
    if (existing) {
      await supabase.from("meal_logs").update({ observacao: obs }).eq("id", existing.id);
    } else {
      await supabase.from("meal_logs").insert({ user_id: user.id, data: today, refeicao: "cafe", concluida: false, observacao: obs });
    }
    toast.success("Observação salva!");
  };

  const isChecked = (ref: string) => logs.find(l => l.refeicao === ref)?.concluida || false;
  const concluidas = refeicoes.filter(r => isChecked(r.value)).length;

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Dieta</h1>
          <p className="text-xs font-extralight tracking-[0.08em] uppercase text-text-secondary mt-1">{concluidas}/{refeicoes.length} refeições feitas hoje</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <button className="flex items-center gap-1.5 px-4 h-9 text-sm font-bold bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-opacity">
              <Plus className="h-4 w-4" /> Plano
            </button>
          </DialogTrigger>
          <DialogContent className="bg-surface border-border">
            <DialogHeader><DialogTitle className="font-bold">Novo item do plano alimentar</DialogTitle></DialogHeader>
            <form onSubmit={addPlan} className="space-y-3">
              <div className="space-y-1">
                <Label className="text-xs font-extralight tracking-[0.08em] uppercase text-text-secondary">Refeição</Label>
                <Select value={form.refeicao} onValueChange={v => setForm({ ...form, refeicao: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{refeicoes.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1"><Label className="text-xs font-extralight tracking-[0.08em] uppercase text-text-secondary">Descrição</Label><Input value={form.descricao} onChange={e => setForm({ ...form, descricao: e.target.value })} required placeholder="Ex: 2 ovos + pão integral" /></div>
              <button type="submit" className="w-full h-10 bg-primary text-primary-foreground font-bold text-sm rounded-md hover:opacity-90 transition-opacity">Adicionar</button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Meal checklist */}
      <div className="bg-surface border border-border rounded-md">
        {refeicoes.map(r => {
          const checked = isChecked(r.value);
          const mealPlans = plans.filter(p => p.refeicao === r.value);
          const expanded = expandedMeals[r.value];
          return (
            <div key={r.value} className="border-b border-border last:border-b-0">
              <div className="flex items-center gap-3 h-14 px-4">
                <Checkbox checked={checked} onCheckedChange={() => toggleRefeicao(r.value)} className="rounded-full h-5 w-5" />
                <r.Icon className={`h-3.5 w-3.5 ${checked ? "text-success" : "text-primary"}`} />
                <span className={`flex-1 text-base ${checked ? "text-success" : ""}`}>{r.label}</span>
                {mealPlans.length > 0 && (
                  <button
                    onClick={() => setExpandedMeals(prev => ({ ...prev, [r.value]: !prev[r.value] }))}
                    className="text-xs text-text-secondary hover:text-primary transition-colors flex items-center gap-1"
                  >
                    {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                    ver detalhes
                  </button>
                )}
              </div>
              {expanded && mealPlans.length > 0 && (
                <div className="px-12 pb-3 space-y-1">
                  {mealPlans.map(p => (
                    <div key={p.id} className="flex justify-between items-center">
                      <span className="text-sm text-text-secondary">{p.descricao}</span>
                      <button onClick={() => deletePlan(p.id)} className="p-1 text-text-muted hover:text-destructive transition-colors">
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Observation */}
      <div className="space-y-2">
        <p className="text-[11px] font-extralight tracking-[0.08em] uppercase text-text-secondary">Observação do dia</p>
        <textarea
          value={obs}
          onChange={e => setObs(e.target.value)}
          placeholder="Ex: compulsão à noite, muita água..."
          rows={2}
          className="w-full bg-transparent border-0 border-b border-border text-sm placeholder:text-text-muted placeholder:italic focus:outline-none focus:border-primary resize-none py-2"
        />
        <button onClick={salvarObs} className="text-xs px-3 py-1.5 border border-border text-text-secondary hover:border-primary hover:text-primary transition-colors rounded-md">Salvar</button>
      </div>

      {/* Weight sparkline */}
      {pesoHistory.length > 1 && (
        <div>
          <p className="text-[11px] font-extralight tracking-[0.08em] uppercase text-text-secondary mb-2">Peso — últimos 7 dias</p>
          <div className="flex items-end gap-1 h-10">
            {pesoHistory.slice(0, 7).reverse().map((p) => {
              const min = Math.min(...pesoHistory.slice(0, 7).map((x: any) => x.peso));
              const max = Math.max(...pesoHistory.slice(0, 7).map((x: any) => x.peso));
              const range = max - min || 1;
              const height = ((p.peso - min) / range) * 100;
              return (
                <div key={p.id} className="flex-1 flex flex-col items-center gap-0.5">
                  <div className="w-full rounded-sm overflow-hidden" style={{ height: `${Math.max(height, 10)}%` }}>
                    <div className="w-full h-full bg-primary rounded-sm" />
                  </div>
                  <span className="text-[8px] text-text-muted">{p.peso}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
