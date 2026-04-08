import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, isToday, isThisWeek } from "date-fns";

const columns = [
  { key: "a_fazer", label: "A fazer" },
  { key: "em_andamento", label: "Em andamento" },
  { key: "feito", label: "Feito" },
];

const prioridades = [
  { value: "alta", label: "Alta", dot: "bg-destructive" },
  { value: "media", label: "Média", dot: "bg-warning" },
  { value: "baixa", label: "Baixa", dot: "bg-text-muted" },
];

type Filter = "todas" | "hoje" | "semana";

export default function TarefasPage() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<any[]>([]);
  const [filter, setFilter] = useState<Filter>("todas");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ titulo: "", prioridade: "media", data_limite: "", status: "a_fazer" });

  useEffect(() => { if (user) loadTasks(); }, [user]);

  const loadTasks = async () => {
    const { data } = await supabase.from("tasks").select("*").order("created_at", { ascending: false });
    setTasks(data || []);
  };

  const filtered = tasks.filter(t => {
    if (filter === "hoje" && t.data_limite) return isToday(new Date(t.data_limite + "T12:00:00"));
    if (filter === "semana" && t.data_limite) return isThisWeek(new Date(t.data_limite + "T12:00:00"));
    return true;
  });

  const createTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const payload: any = { ...form, user_id: user.id };
    if (!payload.data_limite) delete payload.data_limite;
    const { error } = await supabase.from("tasks").insert(payload);
    if (error) toast.error(error.message);
    else { toast.success("Tarefa criada!"); setForm({ titulo: "", prioridade: "media", data_limite: "", status: "a_fazer" }); setOpen(false); loadTasks(); }
  };

  const moveTask = async (id: string, status: string) => {
    await supabase.from("tasks").update({ status }).eq("id", id);
    loadTasks();
  };

  const deleteTask = async (id: string) => {
    await supabase.from("tasks").delete().eq("id", id);
    loadTasks();
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex justify-between items-center flex-wrap gap-2">
        <h1 className="text-2xl font-bold">Tarefas</h1>
        <div className="flex gap-2">
          <div className="flex border border-border rounded-md overflow-hidden">
            {(["todas", "hoje", "semana"] as Filter[]).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 text-xs font-normal transition-colors ${filter === f ? "bg-surface-raised text-foreground" : "text-text-secondary hover:text-foreground"}`}
              >
                {f === "todas" ? "Todas" : f === "hoje" ? "Hoje" : "Semana"}
              </button>
            ))}
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <button className="flex items-center gap-1.5 px-4 h-9 text-sm font-bold bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-opacity">
                <Plus className="h-4 w-4" /> Nova
              </button>
            </DialogTrigger>
            <DialogContent className="bg-surface border-border">
              <DialogHeader><DialogTitle className="font-bold">Nova tarefa</DialogTitle></DialogHeader>
              <form onSubmit={createTask} className="space-y-3">
                <div className="space-y-1"><Label className="text-xs font-extralight tracking-[0.08em] uppercase text-text-secondary">Título</Label><Input value={form.titulo} onChange={e => setForm({ ...form, titulo: e.target.value })} required /></div>
                <div className="space-y-1">
                  <Label className="text-xs font-extralight tracking-[0.08em] uppercase text-text-secondary">Prioridade</Label>
                  <Select value={form.prioridade} onValueChange={v => setForm({ ...form, prioridade: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{prioridades.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1"><Label className="text-xs font-extralight tracking-[0.08em] uppercase text-text-secondary">Data limite</Label><Input type="date" value={form.data_limite} onChange={e => setForm({ ...form, data_limite: e.target.value })} /></div>
                <button type="submit" className="w-full h-10 bg-primary text-primary-foreground font-bold text-sm rounded-md hover:opacity-90 transition-opacity">Criar</button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {columns.map(col => {
          const colTasks = filtered.filter(t => t.status === col.key);
          return (
            <div key={col.key} className="space-y-2">
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-sm font-bold">{col.label}</h2>
                <span className="text-xs font-black bg-primary text-primary-foreground w-5 h-5 flex items-center justify-center rounded-sm">{colTasks.length}</span>
              </div>
              <div className="space-y-2 min-h-[100px]">
                {colTasks.map(t => (
                  <div key={t.id} className="bg-surface-raised border border-border rounded-md p-3">
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${prioridades.find(p => p.value === t.prioridade)?.dot}`} />
                          <span className="text-sm">{t.titulo}</span>
                        </div>
                        {t.data_limite && (
                          <p className="text-[11px] font-extralight tracking-[0.08em] text-text-secondary mt-1 ml-4">
                            {format(new Date(t.data_limite + "T12:00:00"), "dd/MM")}
                          </p>
                        )}
                      </div>
                      <button onClick={() => deleteTask(t.id)} className="p-1 text-text-muted hover:text-destructive transition-colors">
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                    <div className="flex gap-1 mt-2">
                      {columns.filter(c => c.key !== col.key).map(c => (
                        <button key={c.key} onClick={() => moveTask(t.id, c.key)}
                          className="text-[10px] px-2 py-1 border border-border rounded-sm text-text-secondary hover:border-primary hover:text-primary transition-colors">
                          → {c.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
