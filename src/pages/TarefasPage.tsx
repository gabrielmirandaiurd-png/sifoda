import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
  { value: "alta", label: "Alta", color: "bg-destructive/20 text-destructive" },
  { value: "media", label: "Média", color: "bg-yellow-500/20 text-yellow-700 dark:text-yellow-400" },
  { value: "baixa", label: "Baixa", color: "bg-muted text-muted-foreground" },
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
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center flex-wrap gap-2">
        <h1 className="text-2xl font-bold">Tarefas</h1>
        <div className="flex gap-2">
          <div className="flex bg-muted rounded-lg p-0.5">
            {(["todas", "hoje", "semana"] as Filter[]).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${filter === f ? "bg-background shadow-sm" : "text-muted-foreground"}`}
              >
                {f === "todas" ? "Todas" : f === "hoje" ? "Hoje" : "Semana"}
              </button>
            ))}
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1"><Plus className="h-4 w-4" /> Nova</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Nova tarefa</DialogTitle></DialogHeader>
              <form onSubmit={createTask} className="space-y-3">
                <div className="space-y-1"><Label>Título</Label><Input value={form.titulo} onChange={e => setForm({ ...form, titulo: e.target.value })} required /></div>
                <div className="space-y-1">
                  <Label>Prioridade</Label>
                  <Select value={form.prioridade} onValueChange={v => setForm({ ...form, prioridade: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{prioridades.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1"><Label>Data limite</Label><Input type="date" value={form.data_limite} onChange={e => setForm({ ...form, data_limite: e.target.value })} /></div>
                <Button type="submit" className="w-full">Criar</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {columns.map(col => (
          <div key={col.key} className="space-y-2">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">{col.label}</h2>
            <div className="space-y-2 min-h-[100px]">
              {filtered.filter(t => t.status === col.key).map(t => (
                <Card key={t.id} className="p-3">
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{t.titulo}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className={`text-[10px] ${prioridades.find(p => p.value === t.prioridade)?.color}`}>
                          {prioridades.find(p => p.value === t.prioridade)?.label}
                        </Badge>
                        {t.data_limite && (
                          <span className="text-[10px] text-muted-foreground">
                            {format(new Date(t.data_limite + "T12:00:00"), "dd/MM")}
                          </span>
                        )}
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => deleteTask(t.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="flex gap-1 mt-2">
                    {columns.filter(c => c.key !== col.key).map(c => (
                      <Button key={c.key} variant="outline" size="sm" className="text-[10px] h-6 px-2" onClick={() => moveTask(t.id, c.key)}>
                        → {c.label}
                      </Button>
                    ))}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
