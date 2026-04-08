import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Plus, ArrowLeft, ChevronDown, ChevronUp } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";

const statusOptions = [
  { value: "ativo", label: "Ativo" },
  { value: "pausado", label: "Pausado" },
  { value: "concluido", label: "Concluído" },
];

const statusColors: Record<string, string> = {
  ativo: "text-info border-info/30",
  pausado: "text-warning border-warning/30",
  concluido: "text-success border-success/30",
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[11px] font-extralight tracking-[0.08em] uppercase border ${statusColors[status] || "text-text-secondary border-border"}`}>
      {statusOptions.find(s => s.value === status)?.label || status}
    </span>
  );
}

export default function ProjetosPage() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [milestones, setMilestones] = useState<any[]>([]);
  const [breakevenGoal, setBreakevenGoal] = useState<number>(0);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ nome: "", descricao: "", prazo: "", status: "ativo" });
  const [newMilestone, setNewMilestone] = useState("");
  const [expandedProjects, setExpandedProjects] = useState<Record<string, boolean>>({});
  const [projectMilestones, setProjectMilestones] = useState<Record<string, any[]>>({});

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

  const toggleExpandProject = async (projectId: string) => {
    const isExpanded = expandedProjects[projectId];
    setExpandedProjects(prev => ({ ...prev, [projectId]: !isExpanded }));
    if (!isExpanded && !projectMilestones[projectId]) {
      const { data } = await supabase.from("milestones").select("*").eq("project_id", projectId).order("created_at");
      setProjectMilestones(prev => ({ ...prev, [projectId]: data || [] }));
    }
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
      <div className="space-y-6 max-w-2xl mx-auto">
        <button onClick={() => setSelected(null)} className="flex items-center gap-1 text-sm text-text-secondary hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" /> Voltar
        </button>
        <div>
          <div className="flex items-start justify-between">
            <h1 className="text-2xl font-bold">{selected.nome}</h1>
            <StatusBadge status={selected.status} />
          </div>
          {selected.descricao && <p className="text-sm text-text-secondary mt-1">{selected.descricao}</p>}
        </div>
        {total > 0 && (
          <div className="h-1 bg-border rounded-sm overflow-hidden">
            <div className="h-full bg-primary rounded-sm" style={{ width: `${(done / total) * 100}%` }} />
          </div>
        )}
        <div>
          {milestones.map(m => (
            <label key={m.id} className="flex items-center gap-3 h-[48px] px-4 border-b border-border cursor-pointer hover:bg-surface-raised transition-colors">
              <Checkbox checked={m.concluido} onCheckedChange={() => toggleMilestone(m)} className="rounded-full h-5 w-5" />
              <span className={m.concluido ? "line-through text-text-muted" : ""}>{m.nome}</span>
            </label>
          ))}
        </div>
        <form onSubmit={addMilestone} className="flex gap-2">
          <Input value={newMilestone} onChange={e => setNewMilestone(e.target.value)} placeholder="Novo marco..." required className="flex-1" />
          <button type="submit" className="h-10 px-3 border border-border text-text-secondary hover:border-primary hover:text-primary transition-colors rounded-md">
            <Plus className="h-4 w-4" />
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Projetos</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <button className="flex items-center gap-1.5 px-4 h-9 text-sm font-bold bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-opacity">
              <Plus className="h-4 w-4" /> Novo
            </button>
          </DialogTrigger>
          <DialogContent className="bg-surface border-border">
            <DialogHeader><DialogTitle className="font-bold">Novo projeto</DialogTitle></DialogHeader>
            <form onSubmit={createProject} className="space-y-3">
              <div className="space-y-1"><Label className="text-xs font-extralight tracking-[0.08em] uppercase text-text-secondary">Nome</Label><Input value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} required /></div>
              <div className="space-y-1"><Label className="text-xs font-extralight tracking-[0.08em] uppercase text-text-secondary">Descrição</Label><Input value={form.descricao} onChange={e => setForm({ ...form, descricao: e.target.value })} /></div>
              <div className="space-y-1"><Label className="text-xs font-extralight tracking-[0.08em] uppercase text-text-secondary">Prazo</Label><Input type="date" value={form.prazo} onChange={e => setForm({ ...form, prazo: e.target.value })} /></div>
              <div className="space-y-1">
                <Label className="text-xs font-extralight tracking-[0.08em] uppercase text-text-secondary">Status</Label>
                <Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{statusOptions.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <button type="submit" className="w-full h-10 bg-primary text-primary-foreground font-bold text-sm rounded-md hover:opacity-90 transition-opacity">Criar</button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Breakeven */}
      <div className="bg-surface border border-border rounded-md p-4">
        <p className="text-[11px] font-extralight tracking-[0.08em] uppercase text-text-secondary mb-2">Meta de breakeven</p>
        <div className="flex gap-2">
          <Input type="number" value={breakevenGoal || ""} onChange={e => setBreakevenGoal(Number(e.target.value))} placeholder="Meta mensal (R$)" step="0.01" className="flex-1" />
          <button onClick={() => updateBreakeven(String(breakevenGoal))} className="h-10 px-4 border border-border text-sm hover:border-primary hover:text-primary transition-colors rounded-md">Salvar</button>
        </div>
      </div>

      {/* Projects grid */}
      {projects.length === 0 ? (
        <p className="text-text-secondary text-sm text-center py-8">Nenhum projeto ainda.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {projects.map(p => (
            <div key={p.id} className="bg-surface border border-border rounded-md p-5 space-y-3">
              <div className="flex justify-between items-start">
                <h3 className="text-lg font-bold cursor-pointer hover:text-primary transition-colors" onClick={() => openProject(p)}>{p.nome}</h3>
                <StatusBadge status={p.status} />
              </div>
              {p.prazo && <p className="text-xs font-extralight tracking-[0.08em] text-text-secondary">Prazo: {format(new Date(p.prazo + "T12:00:00"), "dd/MM/yyyy")}</p>}
              <button
                onClick={() => toggleExpandProject(p.id)}
                className="flex items-center gap-1 text-xs text-text-secondary hover:text-primary transition-colors"
              >
                {expandedProjects[p.id] ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                Ver marcos
              </button>
              {expandedProjects[p.id] && projectMilestones[p.id] && (
                <div className="space-y-1 pt-1">
                  {projectMilestones[p.id].map((m: any) => (
                    <div key={m.id} className="flex items-center gap-2 text-sm">
                      <span className={`w-1.5 h-1.5 rounded-full ${m.concluido ? "bg-success" : "bg-border"}`} />
                      <span className={m.concluido ? "text-text-muted line-through" : ""}>{m.nome}</span>
                    </div>
                  ))}
                  {projectMilestones[p.id].length === 0 && <p className="text-xs text-text-muted">Nenhum marco</p>}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
