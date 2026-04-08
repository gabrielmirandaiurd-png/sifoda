import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  { value: "pago", label: "Pago" },
  { value: "pendente", label: "Pendente" },
  { value: "atrasado", label: "Atrasado" },
];

const statusDivida = [
  { value: "ativa", label: "Ativa" },
  { value: "negociando", label: "Negociando" },
  { value: "quitada", label: "Quitada" },
];

function StatusBadge({ status }: { status: string }) {
  const colorMap: Record<string, string> = {
    pago: "text-success border-success/30",
    pendente: "text-warning border-warning/30",
    atrasado: "text-destructive border-destructive/30",
    ativa: "text-info border-info/30",
    negociando: "text-warning border-warning/30",
    quitada: "text-success border-success/30",
  };
  const labels: Record<string, string> = {
    pago: "Pago", pendente: "Pendente", atrasado: "Atrasado",
    ativa: "Ativa", negociando: "Negociando", quitada: "Quitada",
  };
  return (
    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[11px] font-extralight tracking-[0.08em] uppercase border ${colorMap[status] || "text-text-secondary border-border"}`}>
      {labels[status] || status}
    </span>
  );
}

export default function FinanceiroPage() {
  const { user } = useAuth();
  const [income, setIncome] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [debts, setDebts] = useState<any[]>([]);
  const [uberLogs, setUberLogs] = useState<any[]>([]);
  const [uberGoal, setUberGoal] = useState<number>(0);
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

  const allTransactions = [
    ...income.map(i => ({ ...i, _type: "entrada" })),
    ...expenses.map(e => ({ ...e, _type: "saida" })),
  ].sort((a, b) => b.data.localeCompare(a.data)).slice(0, 5);

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold">Financeiro</h1>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-transparent border-b border-border rounded-none p-0 h-auto gap-4">
          {["dashboard", "entradas", "saidas", "dividas", "uber"].map(tab => (
            <TabsTrigger
              key={tab}
              value={tab}
              className="rounded-none border-b-2 border-transparent px-0 pb-2 pt-0 text-sm font-normal text-text-secondary data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none data-[state=active]:bg-transparent"
            >
              {tab === "dashboard" ? "Resumo" : tab === "entradas" ? "Entradas" : tab === "saidas" ? "Saídas" : tab === "dividas" ? "Dívidas" : "Uber"}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="dashboard" className="space-y-4 mt-6">
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Saldo", value: totalIncome - totalPago, color: totalIncome - totalPago >= 0 ? "text-success" : "text-destructive" },
              { label: "Pago", value: totalPago, color: "text-foreground" },
              { label: "Pendente", value: totalPendente, color: "text-warning" },
            ].map(m => (
              <div key={m.label} className="bg-surface border border-border rounded-md p-4">
                <p className="text-[11px] font-extralight tracking-[0.08em] uppercase text-text-secondary">{m.label}</p>
                <p className={`text-xl font-black mt-1 ${m.color}`}>
                  R$ {m.value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </p>
              </div>
            ))}
          </div>

          {/* Entradas vs Saídas bar */}
          <div className="bg-surface border border-border rounded-md p-4">
            <p className="text-[11px] font-extralight tracking-[0.08em] uppercase text-text-secondary mb-3">Entradas vs Saídas</p>
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <span className="text-xs text-text-secondary w-16">Entradas</span>
                <div className="flex-1 h-2 bg-border rounded-sm overflow-hidden">
                  <div className="h-full bg-success rounded-sm" style={{ width: `${totalIncome > 0 ? 100 : 0}%` }} />
                </div>
                <span className="text-xs font-bold w-24 text-right">R$ {totalIncome.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-text-secondary w-16">Saídas</span>
                <div className="flex-1 h-2 bg-border rounded-sm overflow-hidden">
                  <div className="h-full bg-destructive rounded-sm" style={{ width: `${totalIncome > 0 ? Math.min((totalPago + totalPendente) / totalIncome * 100, 100) : 0}%` }} />
                </div>
                <span className="text-xs font-bold w-24 text-right">R$ {(totalPago + totalPendente).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>

          {/* Last 5 transactions */}
          {allTransactions.length > 0 && (
            <div className="bg-surface border border-border rounded-md">
              <div className="p-4 border-b border-border">
                <p className="text-[11px] font-extralight tracking-[0.08em] uppercase text-text-secondary">Últimas transações</p>
              </div>
              {allTransactions.map((t, i) => (
                <div key={t.id} className="flex justify-between items-center px-4 h-12 border-b border-border last:border-b-0">
                  <div>
                    <span className="text-sm">{t.nome}</span>
                    <span className="text-xs text-text-secondary ml-2">{format(new Date(t.data + "T12:00:00"), "dd/MM")}</span>
                  </div>
                  <span className={`text-sm font-bold ${t._type === "entrada" ? "text-success" : "text-destructive"}`}>
                    {t._type === "entrada" ? "+" : "-"} R$ {Number(t.valor).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="entradas" className="mt-6">
          <CrudList items={income} type="income" user={user} onRefresh={loadAll}
            renderItem={(item: any) => (
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm">{item.nome}</p>
                  <p className="text-xs text-text-secondary">{categoriasEntrada.find(c => c.value === item.categoria)?.label} · {format(new Date(item.data + "T12:00:00"), "dd/MM/yyyy")}</p>
                </div>
                <span className="text-sm font-bold text-success">+ R$ {Number(item.valor).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
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

        <TabsContent value="saidas" className="mt-6">
          <CrudList items={expenses} type="expenses" user={user} onRefresh={loadAll}
            renderItem={(item: any) => (
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm">{item.nome}</p>
                  <p className="text-xs text-text-secondary">{item.categoria || "Sem categoria"} · {format(new Date(item.data + "T12:00:00"), "dd/MM/yyyy")}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-destructive">- R$ {Number(item.valor).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                  <StatusBadge status={item.status} />
                </div>
              </div>
            )}
            formFields={[
              { name: "nome", label: "Nome", type: "text" },
              { name: "valor", label: "Valor", type: "number" },
              { name: "data", label: "Data", type: "date" },
              { name: "status", label: "Status", type: "select", options: statusSaida },
              { name: "categoria", label: "Categoria", type: "text" },
            ]}
          />
        </TabsContent>

        <TabsContent value="dividas" className="mt-6">
          <CrudList items={debts} type="debts" user={user} onRefresh={loadAll}
            renderItem={(item: any) => (
              <div className="space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-bold">{item.credor}</p>
                    <p className="text-xs font-extralight tracking-[0.08em] text-text-secondary mt-1">
                      {item.parcelas_pagas} de {item.parcelas_total} parcelas
                    </p>
                  </div>
                  <StatusBadge status={item.status} />
                </div>
                <div className="h-1 bg-border rounded-sm overflow-hidden">
                  <div className="h-full bg-primary rounded-sm" style={{ width: `${(item.parcelas_pagas / item.parcelas_total) * 100}%` }} />
                </div>
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

        <TabsContent value="uber" className="mt-6 space-y-4">
          <UberSection user={user} logs={uberLogs} goal={uberGoal} total={uberTotal} progress={uberProgress} onRefresh={loadAll} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function CrudList({ items, type, user, onRefresh, renderItem, formFields }: any) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { ...form, user_id: user.id };
    const { error } = await supabase.from(type).insert(payload);
    if (error) toast.error(error.message);
    else { toast.success("Adicionado!"); setForm({}); setOpen(false); onRefresh(); }
  };

  const handleDelete = async (id: string) => {
    await supabase.from(type).delete().eq("id", id);
    onRefresh();
  };

  return (
    <div className="space-y-3">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <button className="flex items-center gap-1.5 px-4 h-9 text-sm font-bold bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-opacity">
            <Plus className="h-4 w-4" /> Adicionar
          </button>
        </DialogTrigger>
        <DialogContent className="bg-surface border-border">
          <DialogHeader><DialogTitle className="font-bold">Novo registro</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-3">
            {formFields.map((f: any) => (
              <div key={f.name} className="space-y-1">
                <Label className="text-xs font-extralight tracking-[0.08em] uppercase text-text-secondary">{f.label}</Label>
                {f.type === "select" ? (
                  <Select value={form[f.name] || ""} onValueChange={(v) => setForm({ ...form, [f.name]: v })}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>{f.options.map((o: any) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                  </Select>
                ) : (
                  <Input type={f.type} step={f.type === "number" ? "0.01" : undefined} value={form[f.name] || ""} onChange={(e) => setForm({ ...form, [f.name]: e.target.value })} required />
                )}
              </div>
            ))}
            <button type="submit" className="w-full h-10 bg-primary text-primary-foreground font-bold text-sm rounded-md hover:opacity-90 transition-opacity">Salvar</button>
          </form>
        </DialogContent>
      </Dialog>

      {items.length === 0 ? (
        <p className="text-text-secondary text-sm text-center py-8">Nenhum registro ainda.</p>
      ) : (
        <div className="bg-surface border border-border rounded-md">
          {items.map((item: any) => (
            <div key={item.id} className="flex items-center gap-2 px-4 py-3 border-b border-border last:border-b-0">
              <div className="flex-1">{renderItem(item)}</div>
              <button onClick={() => handleDelete(item.id)} className="p-1.5 text-text-muted hover:text-destructive transition-colors">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
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

  // Build daily bars for the week
  const days = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sab", "Dom"];
  const maxVal = Math.max(...logs.map((l: any) => Number(l.valor)), 1);

  return (
    <>
      {/* Big number */}
      <div className="text-center">
        <p className="text-[11px] font-extralight tracking-[0.08em] uppercase text-text-secondary">Total esta semana</p>
        <p className="text-5xl font-black mt-1">R$ {total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
        <div className="mt-3 max-w-xs mx-auto h-1 bg-border rounded-sm overflow-hidden">
          <div className="h-full bg-primary rounded-sm transition-all" style={{ width: `${progress}%` }} />
        </div>
        <p className="text-xs text-text-secondary mt-1">Meta: R$ {goal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
      </div>

      {/* Meta config */}
      <div className="flex gap-2 items-end">
        <div className="flex-1">
          <label className="text-xs font-extralight tracking-[0.08em] uppercase text-text-secondary">Meta semanal (R$)</label>
          <Input type="number" value={meta} onChange={(e) => setMeta(e.target.value)} step="0.01" className="mt-1" />
        </div>
        <button onClick={updateMeta} className="h-10 px-4 border border-border text-sm hover:border-primary hover:text-primary transition-colors rounded-md">Salvar</button>
      </div>

      {/* Register */}
      <form onSubmit={addLog} className="flex gap-2">
        <Input type="number" value={valor} onChange={e => setValor(e.target.value)} placeholder="Valor rodado hoje" step="0.01" required className="flex-1" />
        <button type="submit" className="h-10 px-4 bg-primary text-primary-foreground font-bold text-sm rounded-md hover:opacity-90 transition-opacity">Registrar</button>
      </form>

      {/* Daily log */}
      {logs.length > 0 && (
        <div className="bg-surface border border-border rounded-md">
          {logs.map((l: any) => (
            <div key={l.id} className="flex justify-between text-sm px-4 h-10 items-center border-b border-border last:border-b-0">
              <span className="text-text-secondary">{format(new Date(l.data + "T12:00:00"), "dd/MM/yyyy")}</span>
              <span className="font-bold">R$ {Number(l.valor).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
