import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";

const refeicoes = [
  { value: "cafe", label: "☕ Café da manhã" },
  { value: "almoco", label: "🍽️ Almoço" },
  { value: "lanche", label: "🥪 Lanche" },
  { value: "jantar", label: "🌙 Jantar" },
];

export default function DietaPage() {
  const { user } = useAuth();
  const [plans, setPlans] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [obs, setObs] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ refeicao: "cafe", descricao: "" });

  const today = format(new Date(), "yyyy-MM-dd");

  useEffect(() => { if (user) loadAll(); }, [user]);

  const loadAll = async () => {
    const [planRes, logRes] = await Promise.all([
      supabase.from("meal_plans").select("*").order("created_at"),
      supabase.from("meal_logs").select("*").eq("data", today),
    ]);
    setPlans(planRes.data || []);
    setLogs(logRes.data || []);
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
    <div className="space-y-6 max-w-lg mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Dieta</h1>
          <p className="text-sm text-muted-foreground">{concluidas}/{refeicoes.length} refeições feitas hoje</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button size="sm" className="gap-1"><Plus className="h-4 w-4" /> Plano</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Novo item do plano alimentar</DialogTitle></DialogHeader>
            <form onSubmit={addPlan} className="space-y-3">
              <div className="space-y-1">
                <Label>Refeição</Label>
                <Select value={form.refeicao} onValueChange={v => setForm({ ...form, refeicao: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{refeicoes.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1"><Label>Descrição</Label><Input value={form.descricao} onChange={e => setForm({ ...form, descricao: e.target.value })} required placeholder="Ex: 2 ovos + pão integral" /></div>
              <Button type="submit" className="w-full">Adicionar</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">Checklist do dia</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {refeicoes.map(r => (
            <label key={r.value} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 cursor-pointer hover:bg-muted transition-colors">
              <Checkbox checked={isChecked(r.value)} onCheckedChange={() => toggleRefeicao(r.value)} />
              <div className={isChecked(r.value) ? "line-through text-muted-foreground" : ""}>
                <span className="font-medium">{r.label}</span>
                {plans.filter(p => p.refeicao === r.value).map(p => (
                  <p key={p.id} className="text-xs text-muted-foreground">{p.descricao}</p>
                ))}
              </div>
            </label>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">Observação do dia</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          <Textarea value={obs} onChange={e => setObs(e.target.value)} placeholder="Ex: compulsão à noite, muita água..." rows={3} />
          <Button size="sm" onClick={salvarObs}>Salvar</Button>
        </CardContent>
      </Card>

      {plans.length > 0 && (
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base">Plano alimentar</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {plans.map(p => (
              <div key={p.id} className="flex justify-between items-center py-1">
                <div>
                  <span className="text-sm font-medium">{refeicoes.find(r => r.value === p.refeicao)?.label}</span>
                  <p className="text-xs text-muted-foreground">{p.descricao}</p>
                </div>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => deletePlan(p.id)}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
