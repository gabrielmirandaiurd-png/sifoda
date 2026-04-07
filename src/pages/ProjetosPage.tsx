import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Plus, ChevronRight, ArrowLeft, Target } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const statusOptions = [
  { value: "ativo", label: "Ativo" },
  { value: "pausado", label: "Pausado" },
  { value: "concluido", label: "Concluído" },
];

const statusColors: Record<string, string> = {
  ativo: "bg-accent/20 text-accent",
  pausado: "bg-yellow-500/20 text-yellow-700 dark:text-yellow-400",
  concluido: "bg-muted text-muted-foreground",
};

export default function ProjetosPage() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [milestones, setMilestones] = useState<any[]>([]);
  const [breakevenGoal, setBreakevenGoal] = useState<number>(0);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ nome: "", descricao: "", prazo: "", status: "ativo" });
  const [newMilestone, setNewMilestone] = useState("");

  useEffect(() => { if (user) loadProjects(); }, [user]);

  const loadProjects = async () => {
    const [projRes, beRes] = await Promise.all([
      supabase.from("projects").select("*").order("created_at", { ascending: false }),
      supabase.from("breakeven_goals").select("*").maybeSingle(),
    ]);
    setProjects(projRes.data || []);
    setBreakevenGoal(Number(beRes.data?.meta_mensal) || 0);
  };

  const loadMilestones = async (projectId: string) => {
    const { data } = await supabase.from("milestones").select("*").eq("project_id", projectId).order("created_at");
    setMilestones(data || []);
  };

  const openProject = (p: any) => { setSelected(p); loadMilestones(p.id); };

  const createProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const { error } = await supabase.from("projects").insert({ ...form, user_id: user.id });
    if (error) toast.error(error.message);
    else { toast.success("Projeto criado!"); setForm({ nome: "", descricao: "", prazo: "", status: "ativo" }); setOpen(false); loadProjects(); }
  };

  const addMilestone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selected) return;
    const { error } = await supabase.from("milestones").insert({ nome: newMilestone, project_id: selected.id, user_id: user.id });
    if (error) toast.error(error.message);
    else { setNewMilestone(""); loadMilestones(selected.id); }
  };

  const toggleMilestone = async (m: any) => {
    await supabase.from("milestones").update({ concluido: !m.concluido }).eq("id", m.id);
    loadMilestones(selected.id);
  };

  const updateBreakeven = async (val: string) => {
    if (!user) return;
    await supabase.from("breakeven_goals").upsert({ user_id: user.id, meta_mensal: Number(val) });
    setBreakevenGoal(Number(val));
    toast.success("Meta atualizada!");
  };

  if (selected) {
    const done = milestones.filter(m => m.concluido).length;
    const total = milestones.length;
    return (
      <div className="space-y-6 max-w-lg mx-auto">
        <Button variant="ghost" size="sm" onClick={() => setSelected(null)} className="gap-1">
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{selected.nome}</h1>
          {selected.descricao && <p className="text-muted-foreground text-sm mt-1">{selected.descricao}</p>}
          <Badge className={`mt-2 ${statusColors[selected.status]}`}>{statusOptions.find(s => s.value === selected.status)?.label}</Badge>
        </div>
        {total > 0 && <Progress value={(done / total) * 100} className="h-2" />}
        <div className="space-y-2">
          {milestones.map(m => (
            <label key={m.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 cursor-pointer">
              <Checkbox checked={m.concluido} onCheckedChange={() => toggleMilestone(m)} />
              <span className={m.concluido ? "line-through text-muted-foreground" : ""}>{m.nome}</span>
            </label>
          ))}
        </div>
        <form onSubmit={addMilestone} className="flex gap-2">
          <Input value={newMilestone} onChange={e => setNewMilestone(e.target.value)} placeholder="Novo marco..." required />
          <Button type="submit" size="sm"><Plus className="h-4 w-4" /></Button>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-lg mx-auto">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Projetos</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1"><Plus className="h-4 w-4" /> Novo</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Novo projeto</DialogTitle></DialogHeader>
            <form onSubmit={createProject} className="space-y-3">
              <div className="space-y-1"><Label>Nome</Label><Input value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} required /></div>
              <div className="space-y-1"><Label>Descrição</Label><Input value={form.descricao} onChange={e => setForm({ ...form, descricao: e.target.value })} /></div>
              <div className="space-y-1"><Label>Prazo</Label><Input type="date" value={form.prazo} onChange={e => setForm({ ...form, prazo: e.target.value })} /></div>
              <div className="space-y-1">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{statusOptions.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full">Criar</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2"><Target className="h-4 w-4" /> Meta de breakeven</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input type="number" value={breakevenGoal || ""} onChange={e => setBreakevenGoal(Number(e.target.value))} placeholder="Meta mensal (R$)" step="0.01" />
            <Button onClick={() => updateBreakeven(String(breakevenGoal))}>Salvar</Button>
          </div>
        </CardContent>
      </Card>

      {projects.length === 0 ? (
        <p className="text-muted-foreground text-sm text-center py-8">Nenhum projeto ainda.</p>
      ) : (
        <div className="space-y-2">
          {projects.map(p => (
            <Card key={p.id} className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => openProject(p)}>
              <CardContent className="py-3 px-4 flex items-center justify-between">
                <div>
                  <p className="font-medium">{p.nome}</p>
                  <Badge variant="secondary" className={`text-[10px] mt-1 ${statusColors[p.status]}`}>
                    {statusOptions.find(s => s.value === p.status)?.label}
                  </Badge>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
