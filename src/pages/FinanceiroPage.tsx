import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

const categoriasEntrada = [
  { value: "st_fixo", label: "ST Fixo" },
  { value: "comissao_st", label: "Comissão ST" },
  { value: "uber", label: "Uber" },
  { value: "vr", label: "VR" },
  { value: "outro", label: "Outro" },
];

const statusSaida = [
  { value: "pago", label: "Pago", color: "bg-accent text-accent-foreground" },
  { value: "pendente", label: "Pendente", color: "bg-yellow-500/20 text-yellow-700 dark:text-yellow-400" },
  { value: "atrasado", label: "Atrasado", color: "bg-destructive/20 text-destructive" },
];

const statusDivida = [
  { value: "ativa", label: "Ativa" },
  { value: "negociando", label: "Negociando" },
  { value: "quitada", label: "Quitada" },
];

export default function FinanceiroPage() {
  const { user } = useAuth();
  const [income, setIncome] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [debts, setDebts] = useState<any[]>([]);
  const [uberLogs, setUberLogs] = useState<any[]>([]);
  const [uberGoal, setUberGoal] = useState<number>(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");

  useEffect(() => {
    if (user) loadAll();
  }, [user]);

  const loadAll = async () => {
    const mesAtual = new Date();
    const inicio = format(new Date(mesAtual.getFullYear(), mesAtual.getMonth(), 1), "yyyy-MM-dd");
    const fim = format(new Date(mesAtual.getFullYear(), mesAtual.getMonth() + 1, 0), "yyyy-MM-dd");

    const [incRes, expRes, debtRes, uberLogRes, uberGoalRes] = await Promise.all([
      supabase.from("income").select("*").gte("data", inicio).lte("data", fim).order("data", { ascending: false }),
      supabase.from("expenses").select("*").gte("data", inicio).lte("data", fim).order("data", { ascending: false }),
      supabase.from("debts").select("*").order("created_at", { ascending: false }),
      supabase.from("uber_daily_log").select("*").gte("data", inicio).lte("data", fim).order("data", { ascending: false }),
      supabase.from("uber_goals").select("*").maybeSingle(),
    ]);

    setIncome(incRes.data || []);
    setExpenses(expRes.data || []);
    setDebts(debtRes.data || []);
    setUberLogs(uberLogRes.data || []);
    setUberGoal(Number(uberGoalRes.data?.meta_semanal) || 0);
  };

  const totalIncome = income.reduce((s, r) => s + Number(r.valor), 0);
  const totalPago = expenses.filter(e => e.status === "pago").reduce((s, r) => s + Number(r.valor), 0);
  const totalPendente = expenses.filter(e => e.status !== "pago").reduce((s, r) => s + Number(r.valor), 0);
  const uberTotal = uberLogs.reduce((s, r) => s + Number(r.valor), 0);
  const uberProgress = uberGoal > 0 ? Math.min((uberTotal / uberGoal) * 100, 100) : 0;

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold">Financeiro</h1>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full grid grid-cols-5">
          <TabsTrigger value="dashboard">Resumo</TabsTrigger>
          <TabsTrigger value="entradas">Entradas</TabsTrigger>
          <TabsTrigger value="saidas">Saídas</TabsTrigger>
          <TabsTrigger value="dividas">Dívidas</TabsTrigger>
          <TabsTrigger value="uber">Uber</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-4 mt-4">
          <div className="grid grid-cols-3 gap-3">
            <Card><CardContent className="pt-5">
              <p className="text-xs text-muted-foreground uppercase">Saldo</p>
              <p className={`text-lg font-bold ${totalIncome - totalPago >= 0 ? "text-accent" : "text-destructive"}`}>
                R$ {(totalIncome - totalPago).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </p>
            </CardContent></Card>
            <Card><CardContent className="pt-5">
              <p className="text-xs text-muted-foreground uppercase">Pago</p>
              <p className="text-lg font-bold">R$ {totalPago.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
            </CardContent></Card>
            <Card><CardContent className="pt-5">
              <p className="text-xs text-muted-foreground uppercase">Pendente</p>
              <p className="text-lg font-bold text-yellow-600 dark:text-yellow-400">
                R$ {totalPendente.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </p>
            </CardContent></Card>
          </div>

          {debts.filter(d => d.status !== "quitada").length > 0 && (
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-base">Progresso das dívidas</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {debts.filter(d => d.status !== "quitada").map(d => (
                  <div key={d.id}>
                    <div className="flex justify-between text-sm mb-1">
                      <span>{d.credor}</span>
                      <span className="text-muted-foreground">{d.parcelas_pagas}/{d.parcelas_total}</span>
                    </div>
                    <Progress value={(d.parcelas_pagas / d.parcelas_total) * 100} className="h-2" />
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="entradas" className="mt-4">
          <CrudList
            items={income}
            type="income"
            user={user}
            onRefresh={loadAll}
            renderItem={(item) => (
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium">{item.nome}</p>
                  <p className="text-xs text-muted-foreground">
                    {categoriasEntrada.find(c => c.value === item.categoria)?.label} · {format(new Date(item.data + "T12:00:00"), "dd/MM/yyyy")}
                  </p>
                </div>
                <span className="font-semibold text-accent">+ R$ {Number(item.valor).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
              </div>
            )}
            formFields={[
              { name: "nome", label: "Nome", type: "text" },
              { name: "valor", label: "Valor", type: "number" },
              { name: "data", label: "Data", type: "date" },
              { name: "categoria", label: "Categoria", type: "select", options: categoriasEntrada },
            ]}
          />
        </TabsContent>

        <TabsContent value="saidas" className="mt-4">
          <CrudList
            items={expenses}
            type="expenses"
            user={user}
            onRefresh={loadAll}
            renderItem={(item) => (
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium">{item.nome}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.categoria || "Sem categoria"} · {format(new Date(item.data + "T12:00:00"), "dd/MM/yyyy")}
                  </p>
                </div>
                <div className="text-right">
                  <span className="font-semibold text-destructive">- R$ {Number(item.valor).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                  <Badge variant="secondary" className={`ml-2 text-[10px] ${statusSaida.find(s => s.value === item.status)?.color}`}>
                    {statusSaida.find(s => s.value === item.status)?.label}
                  </Badge>
                </div>
              </div>
            )}
            formFields={[
              { name: "nome", label: "Nome", type: "text" },
              { name: "valor", label: "Valor", type: "number" },
              { name: "data", label: "Data", type: "date" },
              { name: "status", label: "Status", type: "select", options: statusSaida.map(s => ({ value: s.value, label: s.label })) },
              { name: "categoria", label: "Categoria", type: "text" },
            ]}
          />
        </TabsContent>

        <TabsContent value="dividas" className="mt-4">
          <CrudList
            items={debts}
            type="debts"
            user={user}
            onRefresh={loadAll}
            renderItem={(item) => (
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium">{item.credor}</p>
                  <p className="text-xs text-muted-foreground">
                    R$ {Number(item.valor_atual).toLocaleString("pt-BR", { minimumFractionDigits: 2 })} · {item.parcelas_pagas}/{item.parcelas_total} parcelas
                  </p>
                </div>
                <Badge variant="secondary">
                  {statusDivida.find(s => s.value === item.status)?.label}
                </Badge>
              </div>
            )}
            formFields={[
              { name: "credor", label: "Credor", type: "text" },
              { name: "valor_original", label: "Valor original", type: "number" },
              { name: "valor_atual", label: "Valor atual", type: "number" },
              { name: "parcelas_total", label: "Total de parcelas", type: "number" },
              { name: "parcelas_pagas", label: "Parcelas pagas", type: "number" },
              { name: "status", label: "Status", type: "select", options: statusDivida },
            ]}
          />
        </TabsContent>

        <TabsContent value="uber" className="mt-4 space-y-4">
          <UberSection
            user={user}
            logs={uberLogs}
            goal={uberGoal}
            total={uberTotal}
            progress={uberProgress}
            onRefresh={loadAll}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Generic CRUD list component
function CrudList({ items, type, user, onRefresh, renderItem, formFields }: any) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { ...form, user_id: user.id };
    const { error } = await supabase.from(type).insert(payload);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Adicionado!");
      setForm({});
      setOpen(false);
      onRefresh();
    }
  };

  const handleDelete = async (id: string) => {
    await supabase.from(type).delete().eq("id", id);
    onRefresh();
  };

  return (
    <div className="space-y-3">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button size="sm" className="gap-1"><Plus className="h-4 w-4" /> Adicionar</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader><DialogTitle>Novo registro</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-3">
            {formFields.map((f: any) => (
              <div key={f.name} className="space-y-1">
                <Label>{f.label}</Label>
                {f.type === "select" ? (
                  <Select value={form[f.name] || ""} onValueChange={(v) => setForm({ ...form, [f.name]: v })}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      {f.options.map((o: any) => (
                        <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    type={f.type}
                    step={f.type === "number" ? "0.01" : undefined}
                    value={form[f.name] || ""}
                    onChange={(e) => setForm({ ...form, [f.name]: e.target.value })}
                    required
                  />
                )}
              </div>
            ))}
            <Button type="submit" className="w-full">Salvar</Button>
          </form>
        </DialogContent>
      </Dialog>

      {items.length === 0 ? (
        <p className="text-muted-foreground text-sm text-center py-8">Nenhum registro ainda.</p>
      ) : (
        <div className="space-y-2">
          {items.map((item: any) => (
            <Card key={item.id} className="p-3">
              <div className="flex items-center gap-2">
                <div className="flex-1">{renderItem(item)}</div>
                <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)}>
                  <Trash2 className="h-4 w-4 text-muted-foreground" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function UberSection({ user, logs, goal, total, progress, onRefresh }: any) {
  const [valor, setValor] = useState("");
  const [meta, setMeta] = useState(String(goal));

  useEffect(() => { setMeta(String(goal)); }, [goal]);

  const addLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const { error } = await supabase.from("uber_daily_log").upsert({
      user_id: user.id,
      data: format(new Date(), "yyyy-MM-dd"),
      valor: Number(valor),
    });
    if (error) toast.error(error.message);
    else { toast.success("Registrado!"); setValor(""); onRefresh(); }
  };

  const updateMeta = async () => {
    if (!user) return;
    const { error } = await supabase.from("uber_goals").upsert({
      user_id: user.id,
      meta_semanal: Number(meta),
    });
    if (error) toast.error(error.message);
    else { toast.success("Meta atualizada!"); onRefresh(); }
  };

  return (
    <>
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">Meta semanal Uber</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Input
              type="number"
              value={meta}
              onChange={(e) => setMeta(e.target.value)}
              placeholder="Meta em R$"
              step="0.01"
            />
            <Button onClick={updateMeta}>Salvar</Button>
          </div>
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>R$ {total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
              <span className="text-muted-foreground">R$ {goal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
            </div>
            <Progress value={progress} className="h-3" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">Registrar valor do dia</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={addLog} className="flex gap-2">
            <Input type="number" value={valor} onChange={e => setValor(e.target.value)} placeholder="Valor rodado hoje" step="0.01" required />
            <Button type="submit">Salvar</Button>
          </form>
        </CardContent>
      </Card>

      {logs.length > 0 && (
        <Card>
          <CardContent className="pt-5 space-y-2">
            {logs.map((l: any) => (
              <div key={l.id} className="flex justify-between text-sm">
                <span>{format(new Date(l.data + "T12:00:00"), "dd/MM/yyyy")}</span>
                <span className="font-medium">R$ {Number(l.valor).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </>
  );
}
