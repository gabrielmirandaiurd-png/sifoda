import { useState, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Plus, Trash2, ChevronDown, Pencil } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";

// Status badge component
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

// Currency formatting helper
function formatBRL(value: number) {
  return `R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
}

// Currency input component
function CurrencyInput({ value, onChange, placeholder, required }: { value: string; onChange: (v: string) => void; placeholder?: string; required?: boolean }) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^\d]/g, "");
    const num = parseInt(raw || "0", 10) / 100;
    onChange(num.toFixed(2));
  };

  const display = value ? `R$ ${Number(value).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : "";

  return (
    <Input
      value={display}
      onChange={handleChange}
      placeholder={placeholder || "R$ 0,00"}
      required={required}
    />
  );
}

// Pill selector component
function PillSelect({ options, value, onChange, multi }: { options: { value: string; label: string }[]; value: string | string[]; onChange: (v: any) => void; multi?: boolean }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map(o => {
        const selected = multi ? (value as string[]).includes(o.value) : value === o.value;
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => {
              if (multi) {
                const arr = value as string[];
                onChange(arr.includes(o.value) ? arr.filter(v => v !== o.value) : [...arr, o.value]);
              } else {
                onChange(o.value);
              }
            }}
            className={`px-3 py-2 text-xs rounded-md border transition-colors ${selected ? "bg-primary text-primary-foreground border-primary" : "border-border text-text-secondary hover:border-border-active"}`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

// Date quick chips + input
function DateInput({ value, onChange, label }: { value: string; onChange: (v: string) => void; label?: string }) {
  const today = format(new Date(), "yyyy-MM-dd");
  const yesterday = format(new Date(Date.now() - 86400000), "yyyy-MM-dd");
  const tomorrow = format(new Date(Date.now() + 86400000), "yyyy-MM-dd");

  return (
    <div className="space-y-1">
      {label && <Label className="text-xs font-extralight tracking-[0.08em] uppercase text-text-secondary">{label}</Label>}
      <div className="flex gap-1 mb-1">
        {[{ l: "Ontem", v: yesterday }, { l: "Hoje", v: today }, { l: "Amanhã", v: tomorrow }].map(c => (
          <button key={c.l} type="button" onClick={() => onChange(c.v)}
            className={`px-2 py-1 text-[10px] rounded border transition-colors ${value === c.v ? "bg-primary text-primary-foreground border-primary" : "border-border text-text-secondary"}`}>
            {c.l}
          </button>
        ))}
      </div>
      <Input type="date" value={value} onChange={e => onChange(e.target.value)} />
    </div>
  );
}

// Collapsible "Mais detalhes" section
function MoreDetails({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button type="button" onClick={() => setOpen(!open)} className="flex items-center gap-1 text-xs text-text-secondary hover:text-primary transition-colors">
        <ChevronDown className={`h-3 w-3 transition-transform ${open ? "rotate-180" : ""}`} />
        Mais detalhes
      </button>
      {open && <div className="mt-2 space-y-3">{children}</div>}
    </div>
  );
}

// Type configurations
const categoriasReceita = [
  { value: "salario_fixo", label: "Salário fixo" },
  { value: "comissao", label: "Comissão" },
  { value: "uber", label: "Uber" },
  { value: "vale", label: "Vale" },
  { value: "freelance", label: "Freelance" },
  { value: "outro", label: "Outro" },
];

const categoriasDespesa = [
  { value: "moradia", label: "Moradia" },
  { value: "transporte", label: "Transporte" },
  { value: "alimentacao", label: "Alimentação" },
  { value: "saude", label: "Saúde" },
  { value: "educacao", label: "Educação" },
  { value: "assinatura", label: "Assinatura" },
  { value: "divida", label: "Dívida" },
  { value: "outro", label: "Outro" },
];

const categoriasInvestimento = [
  { value: "estoque", label: "Estoque" },
  { value: "reserva", label: "Reserva de emergência" },
  { value: "capital_giro", label: "Capital de giro" },
  { value: "educacao", label: "Educação" },
  { value: "equipamento", label: "Equipamento" },
  { value: "outro", label: "Outro" },
];

const formasPagamento = [
  { value: "pix", label: "PIX" },
  { value: "dinheiro", label: "Dinheiro" },
  { value: "debito", label: "Cartão débito" },
  { value: "credito", label: "Cartão crédito" },
  { value: "negociado", label: "Negociado" },
  { value: "desconto", label: "Desconto obtido" },
];

const statusDespesa = [
  { value: "pago", label: "Pago" },
  { value: "pendente", label: "Pendente" },
  { value: "atrasado", label: "Atrasado" },
];

const tiposDivida = [
  { value: "emprestimo", label: "Empréstimo pessoal" },
  { value: "cartao", label: "Cartão de crédito" },
  { value: "banco", label: "Banco" },
  { value: "familiar", label: "Familiar" },
  { value: "agiota", label: "Agiota" },
  { value: "parcelamento", label: "Parcelamento" },
  { value: "outro", label: "Outro" },
];

const statusDivida = [
  { value: "ativa", label: "Ativa" },
  { value: "negociando", label: "Negociando" },
  { value: "quitada", label: "Quitada" },
];

// Entry type definitions
const entryTypes = [
  { value: "receita", label: "RECEITA" },
  { value: "despesa", label: "DESPESA" },
  { value: "quitacao", label: "QUITAÇÃO" },
  { value: "investimento", label: "INVESTIMENTO" },
];

// ─── ENTRY FORM ──────────────────────────────────────
function EntryForm({ type, debts, onSave, onClose }: { type: string; debts: any[]; onSave: () => void; onClose: () => void }) {
  const { user } = useAuth();
  const today = format(new Date(), "yyyy-MM-dd");
  const [form, setForm] = useState<any>({ data: today, status: "pendente", recorrente: false, parcelas: false });
  const [saving, setSaving] = useState(false);

  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);

    try {
      if (type === "receita") {
        const { error } = await supabase.from("transactions").insert({
          user_id: user.id, type: "receita", descricao: form.descricao, valor: Number(form.valor),
          data: form.data, categoria: form.categoria, recorrente: form.recorrente,
          frequencia: form.recorrente ? form.frequencia : null, observacao: form.observacao, status: "pago",
        });
        if (error) throw error;
        // Also insert into income for backward compat
        await supabase.from("income").insert({
          user_id: user.id, nome: form.descricao, valor: Number(form.valor),
          data: form.data, categoria: form.categoria || "outro",
        });
      } else if (type === "despesa") {
        const { error } = await supabase.from("transactions").insert({
          user_id: user.id, type: "despesa", descricao: form.descricao, valor: Number(form.valor),
          data: form.data, vencimento: form.vencimento || null, categoria: form.categoria,
          status: form.status, credor: form.credor,
          parcelas_total: form.parcelas ? Number(form.parcelas_total) : null,
          parcela_atual: form.parcelas ? Number(form.parcela_atual) : null,
          recorrente: false, observacao: form.observacao,
        });
        if (error) throw error;
        await supabase.from("expenses").insert({
          user_id: user.id, nome: form.descricao, valor: Number(form.valor),
          data: form.data, status: form.status, categoria: form.categoria,
        });
      } else if (type === "quitacao") {
        // Insert debt payment
        const { error } = await supabase.from("debt_payments").insert({
          user_id: user.id, debt_id: form.debt_id, valor_pago: Number(form.valor),
          data_pagamento: form.data, forma_pagamento: form.forma_pagamento, observacao: form.observacao,
        });
        if (error) throw error;
        // Update debt: subtract from valor_atual, increment parcelas_pagas
        const debt = debts.find(d => d.id === form.debt_id);
        if (debt) {
          const novoValor = Math.max(0, Number(debt.valor_atual) - Number(form.valor));
          const novasParcelas = debt.parcelas_pagas + 1;
          const novoStatus = novoValor <= 0 ? "quitada" : debt.status;
          await supabase.from("debts").update({
            valor_atual: novoValor, parcelas_pagas: novasParcelas, status: novoStatus,
          }).eq("id", form.debt_id);
        }
        // Also record as transaction
        await supabase.from("transactions").insert({
          user_id: user.id, type: "quitacao", descricao: `Pagamento: ${debt?.credor || ""}`,
          valor: Number(form.valor), data: form.data, debt_id: form.debt_id,
          status: "pago", observacao: form.observacao,
        });
      } else if (type === "investimento") {
        const { error } = await supabase.from("transactions").insert({
          user_id: user.id, type: "investimento", descricao: form.descricao, valor: Number(form.valor),
          data: form.data, categoria: form.categoria, observacao: form.observacao, status: "pago",
        });
        if (error) throw error;
      }
      onSave();
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 max-h-[60vh] overflow-y-auto">
      {type === "receita" && (
        <>
          <Field label="Descrição"><Input value={form.descricao || ""} onChange={e => set("descricao", e.target.value)} placeholder="Ex: Salário ST, Comissão, Uber semana" required /></Field>
          <Field label="Valor"><CurrencyInput value={form.valor || ""} onChange={v => set("valor", v)} required /></Field>
          <DateInput value={form.data} onChange={v => set("data", v)} label="Data" />
          <Field label="Categoria"><PillSelect options={categoriasReceita} value={form.categoria || ""} onChange={v => set("categoria", v)} /></Field>
          <MoreDetails>
            <div className="flex items-center gap-2">
              <input type="checkbox" checked={form.recorrente} onChange={e => set("recorrente", e.target.checked)} className="rounded" />
              <span className="text-sm text-text-secondary">Recorrente?</span>
            </div>
            {form.recorrente && (
              <Field label="Frequência"><PillSelect options={[{ value: "semanal", label: "Semanal" }, { value: "mensal", label: "Mensal" }, { value: "pontual", label: "Pontual" }]} value={form.frequencia || ""} onChange={v => set("frequencia", v)} /></Field>
            )}
            <Field label="Observação"><Input value={form.observacao || ""} onChange={e => set("observacao", e.target.value)} placeholder="Opcional" /></Field>
          </MoreDetails>
        </>
      )}

      {type === "despesa" && (
        <>
          <Field label="Descrição"><Input value={form.descricao || ""} onChange={e => set("descricao", e.target.value)} placeholder="Ex: Aluguel carro, Claro, Mercado" required /></Field>
          <Field label="Valor"><CurrencyInput value={form.valor || ""} onChange={v => set("valor", v)} required /></Field>
          <DateInput value={form.data} onChange={v => set("data", v)} label="Data" />
          <Field label="Categoria"><PillSelect options={categoriasDespesa} value={form.categoria || ""} onChange={v => set("categoria", v)} /></Field>
          <Field label="Status"><PillSelect options={statusDespesa} value={form.status} onChange={v => set("status", v)} /></Field>
          <MoreDetails>
            <DateInput value={form.vencimento || ""} onChange={v => set("vencimento", v)} label="Vencimento" />
            <div className="flex items-center gap-2">
              <input type="checkbox" checked={form.parcelas} onChange={e => set("parcelas", e.target.checked)} className="rounded" />
              <span className="text-sm text-text-secondary">Parcelas?</span>
            </div>
            {form.parcelas && (
              <div className="grid grid-cols-2 gap-2">
                <Field label="Nº de parcelas"><Input type="number" value={form.parcelas_total || ""} onChange={e => set("parcelas_total", e.target.value)} /></Field>
                <Field label="Parcela atual"><Input type="number" value={form.parcela_atual || ""} onChange={e => set("parcela_atual", e.target.value)} /></Field>
              </div>
            )}
            <Field label="Credor"><Input value={form.credor || ""} onChange={e => set("credor", e.target.value)} placeholder="Opcional" /></Field>
            <Field label="Observação"><Input value={form.observacao || ""} onChange={e => set("observacao", e.target.value)} placeholder="Opcional" /></Field>
          </MoreDetails>
        </>
      )}

      {type === "quitacao" && (
        <>
          <Field label="Selecionar dívida">
            <PillSelect
              options={debts.filter(d => d.status !== "quitada").map(d => ({ value: d.id, label: `${d.credor} (${formatBRL(Number(d.valor_atual))})` }))}
              value={form.debt_id || ""}
              onChange={v => set("debt_id", v)}
            />
          </Field>
          <Field label="Valor pago agora"><CurrencyInput value={form.valor || ""} onChange={v => set("valor", v)} required /></Field>
          <DateInput value={form.data} onChange={v => set("data", v)} label="Data do pagamento" />
          <Field label="Forma de pagamento"><PillSelect options={formasPagamento} value={form.forma_pagamento || ""} onChange={v => set("forma_pagamento", v)} /></Field>
          <MoreDetails>
            <Field label="Observação"><Input value={form.observacao || ""} onChange={e => set("observacao", e.target.value)} placeholder="Opcional" /></Field>
          </MoreDetails>
        </>
      )}

      {type === "investimento" && (
        <>
          <Field label="Descrição"><Input value={form.descricao || ""} onChange={e => set("descricao", e.target.value)} placeholder="Ex: Aporte drop, Estoque calçados, Reserva" required /></Field>
          <Field label="Valor"><CurrencyInput value={form.valor || ""} onChange={v => set("valor", v)} required /></Field>
          <DateInput value={form.data} onChange={v => set("data", v)} label="Data" />
          <Field label="Tipo"><PillSelect options={categoriasInvestimento} value={form.categoria || ""} onChange={v => set("categoria", v)} /></Field>
          <MoreDetails>
            <Field label="Retorno esperado"><Input value={form.retorno || ""} onChange={e => set("retorno", e.target.value)} placeholder="Ex: 30% em 45 dias" /></Field>
            <Field label="Observação"><Input value={form.observacao || ""} onChange={e => set("observacao", e.target.value)} placeholder="Opcional" /></Field>
          </MoreDetails>
        </>
      )}

      <button type="submit" disabled={saving}
        className="w-full h-10 bg-primary text-primary-foreground font-bold text-sm rounded-md hover:opacity-90 transition-opacity disabled:opacity-50">
        {saving ? "Salvando..." : "Salvar"}
      </button>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs font-extralight tracking-[0.08em] uppercase text-text-secondary">{label}</Label>
      {children}
    </div>
  );
}

// ─── DEBT FORM ──────────────────────────────────────
function DebtForm({ onSave, onClose }: { onSave: () => void; onClose: () => void }) {
  const { user } = useAuth();
  const today = format(new Date(), "yyyy-MM-dd");
  const [form, setForm] = useState<any>({ data_inicio: today, status: "ativa", frequencia: "mensal" });
  const [saving, setSaving] = useState(false);
  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("debts").insert({
        user_id: user.id, credor: form.credor, valor_original: Number(form.valor_original),
        valor_atual: Number(form.valor_original), data_inicio: form.data_inicio, tipo: form.tipo,
        parcelas_total: form.parcelas_total ? Number(form.parcelas_total) : 1,
        valor_parcela: form.valor_parcela ? Number(form.valor_parcela) : null,
        frequencia: form.frequencia, status: form.status, observacao: form.observacao,
      });
      if (error) throw error;
      onSave();
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 max-h-[60vh] overflow-y-auto">
      <Field label="Credor"><Input value={form.credor || ""} onChange={e => set("credor", e.target.value)} required /></Field>
      <Field label="Valor original"><CurrencyInput value={form.valor_original || ""} onChange={v => set("valor_original", v)} required /></Field>
      <DateInput value={form.data_inicio} onChange={v => set("data_inicio", v)} label="Data de início" />
      <Field label="Tipo"><PillSelect options={tiposDivida} value={form.tipo || ""} onChange={v => set("tipo", v)} /></Field>
      <Field label="Status inicial"><PillSelect options={[{ value: "ativa", label: "Ativa" }, { value: "negociando", label: "Negociando" }]} value={form.status} onChange={v => set("status", v)} /></Field>
      <MoreDetails>
        <div className="grid grid-cols-2 gap-2">
          <Field label="Parcelas"><Input type="number" value={form.parcelas_total || ""} onChange={e => set("parcelas_total", e.target.value)} /></Field>
          <Field label="Valor da parcela"><CurrencyInput value={form.valor_parcela || ""} onChange={v => set("valor_parcela", v)} /></Field>
        </div>
        <Field label="Frequência"><PillSelect options={[{ value: "diaria", label: "Diária" }, { value: "semanal", label: "Semanal" }, { value: "mensal", label: "Mensal" }]} value={form.frequencia} onChange={v => set("frequencia", v)} /></Field>
        <Field label="Observação"><Input value={form.observacao || ""} onChange={e => set("observacao", e.target.value)} /></Field>
      </MoreDetails>
      <button type="submit" disabled={saving}
        className="w-full h-10 bg-primary text-primary-foreground font-bold text-sm rounded-md hover:opacity-90 transition-opacity disabled:opacity-50">
        {saving ? "Salvando..." : "Cadastrar dívida"}
      </button>
    </form>
  );
}

// ─── MAIN PAGE ──────────────────────────────────────
export default function FinanceiroPage() {
  const { user } = useAuth();
  const [income, setIncome] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [debts, setDebts] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [uberLogs, setUberLogs] = useState<any[]>([]);
  const [uberGoal, setUberGoal] = useState<number>(0);
  const [activeTab, setActiveTab] = useState("dashboard");

  // FAB modal
  const [fabOpen, setFabOpen] = useState(false);
  const [entryType, setEntryType] = useState("receita");
  // Debt form modal
  const [debtFormOpen, setDebtFormOpen] = useState(false);

  useEffect(() => { if (user) loadAll(); }, [user]);

  const loadAll = useCallback(async () => {
    const mesAtual = new Date();
    const inicio = format(new Date(mesAtual.getFullYear(), mesAtual.getMonth(), 1), "yyyy-MM-dd");
    const fim = format(new Date(mesAtual.getFullYear(), mesAtual.getMonth() + 1, 0), "yyyy-MM-dd");

    const [incRes, expRes, debtRes, uberLogRes, uberGoalRes, txRes] = await Promise.all([
      supabase.from("income").select("*").gte("data", inicio).lte("data", fim).order("data", { ascending: false }),
      supabase.from("expenses").select("*").gte("data", inicio).lte("data", fim).order("data", { ascending: false }),
      supabase.from("debts").select("*").order("created_at", { ascending: false }),
      supabase.from("uber_daily_log").select("*").gte("data", inicio).lte("data", fim).order("data", { ascending: false }),
      supabase.from("uber_goals").select("*").maybeSingle(),
      supabase.from("transactions").select("*").gte("data", inicio).lte("data", fim).order("data", { ascending: false }),
    ]);

    setIncome(incRes.data || []);
    setExpenses(expRes.data || []);
    setDebts(debtRes.data || []);
    setUberLogs(uberLogRes.data || []);
    setUberGoal(Number(uberGoalRes.data?.meta_semanal) || 0);
    setTransactions(txRes.data || []);
  }, [user]);

  const totalIncome = income.reduce((s, r) => s + Number(r.valor), 0);
  const totalPago = expenses.filter(e => e.status === "pago").reduce((s, r) => s + Number(r.valor), 0);
  const totalPendente = expenses.filter(e => e.status !== "pago").reduce((s, r) => s + Number(r.valor), 0);
  const uberTotal = uberLogs.reduce((s, r) => s + Number(r.valor), 0);
  const uberProgress = uberGoal > 0 ? Math.min((uberTotal / uberGoal) * 100, 100) : 0;

  const allTransactions = [
    ...income.map(i => ({ ...i, _type: "entrada", _desc: i.nome })),
    ...expenses.map(e => ({ ...e, _type: "saida", _desc: e.nome })),
  ].sort((a, b) => b.data.localeCompare(a.data)).slice(0, 5);

  const handleDelete = async (table: string, id: string) => {
    await supabase.from(table).delete().eq("id", id);
    loadAll();
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto relative">
      <h1 className="text-2xl font-bold">Financeiro</h1>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-transparent border-b border-border rounded-none p-0 h-auto gap-4">
          {[{ v: "dashboard", l: "Resumo" }, { v: "entradas", l: "Entradas" }, { v: "saidas", l: "Saídas" }, { v: "dividas", l: "Dívidas" }, { v: "uber", l: "Uber" }].map(tab => (
            <TabsTrigger key={tab.v} value={tab.v}
              className="rounded-none border-b-2 border-transparent px-0 pb-2 pt-0 text-sm font-normal text-text-secondary data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none data-[state=active]:bg-transparent">
              {tab.l}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* DASHBOARD */}
        <TabsContent value="dashboard" className="space-y-4 mt-6">
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Saldo", value: totalIncome - totalPago, color: totalIncome - totalPago >= 0 ? "text-success" : "text-destructive" },
              { label: "Pago", value: totalPago, color: "text-foreground" },
              { label: "Pendente", value: totalPendente, color: "text-warning" },
            ].map(m => (
              <div key={m.label} className="bg-surface border border-border rounded-md p-4">
                <p className="text-[11px] font-extralight tracking-[0.08em] uppercase text-text-secondary">{m.label}</p>
                <p className={`text-xl font-black mt-1 ${m.color}`}>{formatBRL(m.value)}</p>
              </div>
            ))}
          </div>

          <div className="bg-surface border border-border rounded-md p-4">
            <p className="text-[11px] font-extralight tracking-[0.08em] uppercase text-text-secondary mb-3">Entradas vs Saídas</p>
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <span className="text-xs text-text-secondary w-16">Entradas</span>
                <div className="flex-1 h-2 bg-border rounded-sm overflow-hidden">
                  <div className="h-full bg-success rounded-sm" style={{ width: `${totalIncome > 0 ? 100 : 0}%` }} />
                </div>
                <span className="text-xs font-bold w-24 text-right">{formatBRL(totalIncome)}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-text-secondary w-16">Saídas</span>
                <div className="flex-1 h-2 bg-border rounded-sm overflow-hidden">
                  <div className="h-full bg-destructive rounded-sm" style={{ width: `${totalIncome > 0 ? Math.min((totalPago + totalPendente) / totalIncome * 100, 100) : 0}%` }} />
                </div>
                <span className="text-xs font-bold w-24 text-right">{formatBRL(totalPago + totalPendente)}</span>
              </div>
            </div>
          </div>

          {allTransactions.length > 0 && (
            <div className="bg-surface border border-border rounded-md">
              <div className="p-4 border-b border-border">
                <p className="text-[11px] font-extralight tracking-[0.08em] uppercase text-text-secondary">Últimas transações</p>
              </div>
              {allTransactions.map(t => (
                <div key={t.id} className="flex justify-between items-center px-4 h-12 border-b border-border last:border-b-0">
                  <div>
                    <span className="text-sm">{t._desc}</span>
                    <span className="text-xs text-text-secondary ml-2">{format(new Date(t.data + "T12:00:00"), "dd/MM")}</span>
                  </div>
                  <span className={`text-sm font-bold ${t._type === "entrada" ? "text-success" : "text-destructive"}`}>
                    {t._type === "entrada" ? "+" : "-"} {formatBRL(Number(t.valor))}
                  </span>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ENTRADAS */}
        <TabsContent value="entradas" className="mt-6 space-y-3">
          {income.length === 0 ? (
            <p className="text-text-secondary text-sm text-center py-8">Nenhuma entrada este mês.</p>
          ) : (
            <div className="bg-surface border border-border rounded-md">
              {income.map(item => (
                <div key={item.id} className="flex items-center gap-2 px-4 py-3 border-b border-border last:border-b-0 group">
                  <div className="flex-1">
                    <p className="text-sm">{item.nome}</p>
                    <p className="text-xs text-text-secondary">{categoriasReceita.find(c => c.value === item.categoria)?.label || item.categoria} · {format(new Date(item.data + "T12:00:00"), "dd/MM/yyyy")}</p>
                  </div>
                  <span className="text-sm font-bold text-success">+ {formatBRL(Number(item.valor))}</span>
                  <button onClick={() => handleDelete("income", item.id)} className="p-1.5 text-text-muted hover:text-destructive transition-colors opacity-0 group-hover:opacity-100">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* SAÍDAS */}
        <TabsContent value="saidas" className="mt-6 space-y-3">
          {expenses.length === 0 ? (
            <p className="text-text-secondary text-sm text-center py-8">Nenhuma saída este mês.</p>
          ) : (
            <div className="bg-surface border border-border rounded-md">
              {expenses.map(item => (
                <div key={item.id} className="flex items-center gap-2 px-4 py-3 border-b border-border last:border-b-0 group">
                  <div className="flex-1">
                    <p className="text-sm">{item.nome}</p>
                    <p className="text-xs text-text-secondary">{item.categoria || "Sem categoria"} · {format(new Date(item.data + "T12:00:00"), "dd/MM/yyyy")}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-destructive">- {formatBRL(Number(item.valor))}</span>
                    <StatusBadge status={item.status} />
                  </div>
                  <button onClick={() => handleDelete("expenses", item.id)} className="p-1.5 text-text-muted hover:text-destructive transition-colors opacity-0 group-hover:opacity-100">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* DÍVIDAS */}
        <TabsContent value="dividas" className="mt-6 space-y-4">
          <button onClick={() => setDebtFormOpen(true)}
            className="flex items-center gap-1.5 px-4 h-9 text-sm font-bold border border-border text-text-secondary hover:border-primary hover:text-primary rounded-md transition-colors">
            <Plus className="h-4 w-4" /> Cadastrar nova dívida
          </button>
          {debts.length === 0 ? (
            <p className="text-text-secondary text-sm text-center py-8">Nenhuma dívida cadastrada.</p>
          ) : (
            <div className="bg-surface border border-border rounded-md">
              {debts.map(item => (
                <div key={item.id} className="px-4 py-3 border-b border-border last:border-b-0 space-y-2 group">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-bold">{item.credor}</p>
                      <p className="text-xs font-extralight tracking-[0.08em] text-text-secondary mt-1">
                        {item.parcelas_pagas} de {item.parcelas_total} parcelas · {formatBRL(Number(item.valor_atual))} restante
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={item.status} />
                      <button onClick={() => handleDelete("debts", item.id)} className="p-1 text-text-muted hover:text-destructive transition-colors opacity-0 group-hover:opacity-100">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                  <div className="h-1 bg-border rounded-sm overflow-hidden">
                    <div className="h-full bg-primary rounded-sm" style={{ width: `${item.parcelas_total > 0 ? (item.parcelas_pagas / item.parcelas_total) * 100 : 0}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* UBER */}
        <TabsContent value="uber" className="mt-6 space-y-4">
          <UberSection user={user} logs={uberLogs} goal={uberGoal} total={uberTotal} progress={uberProgress} onRefresh={loadAll} />
        </TabsContent>
      </Tabs>

      {/* FLOATING ACTION BUTTON */}
      <button
        onClick={() => setFabOpen(true)}
        className="fixed bottom-20 md:bottom-8 right-6 z-50 w-14 h-14 rounded-md bg-primary text-primary-foreground flex items-center justify-center shadow-lg hover:opacity-90 transition-opacity"
      >
        <Plus className="h-6 w-6" />
      </button>

      {/* FAB ENTRY MODAL */}
      <Dialog open={fabOpen} onOpenChange={setFabOpen}>
        <DialogContent className="bg-surface border-border max-w-md">
          <DialogHeader><DialogTitle className="font-bold">Novo lançamento</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <PillSelect options={entryTypes} value={entryType} onChange={setEntryType} />
            <EntryForm type={entryType} debts={debts} onSave={loadAll} onClose={() => setFabOpen(false)} />
          </div>
        </DialogContent>
      </Dialog>

      {/* DEBT FORM MODAL */}
      <Dialog open={debtFormOpen} onOpenChange={setDebtFormOpen}>
        <DialogContent className="bg-surface border-border max-w-md">
          <DialogHeader><DialogTitle className="font-bold">Cadastrar nova dívida</DialogTitle></DialogHeader>
          <DebtForm onSave={loadAll} onClose={() => setDebtFormOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── UBER SECTION (kept intact) ──────────────────────
function UberSection({ user, logs, goal, total, progress, onRefresh }: any) {
  const [valor, setValor] = useState("");
  const [meta, setMeta] = useState(String(goal));

  useEffect(() => { setMeta(String(goal)); }, [goal]);

  const addLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const { error } = await supabase.from("uber_daily_log").upsert({
      user_id: user.id, data: format(new Date(), "yyyy-MM-dd"), valor: Number(valor),
    });
    if (error) toast.error(error.message);
    else { toast.success("Registrado!"); setValor(""); onRefresh(); }
  };

  const updateMeta = async () => {
    if (!user) return;
    const { error } = await supabase.from("uber_goals").upsert({
      user_id: user.id, meta_semanal: Number(meta),
    });
    if (error) toast.error(error.message);
    else { toast.success("Meta atualizada!"); onRefresh(); }
  };

  return (
    <>
      <div className="text-center">
        <p className="text-[11px] font-extralight tracking-[0.08em] uppercase text-text-secondary">Total esta semana</p>
        <p className="text-5xl font-black mt-1">{formatBRL(total)}</p>
        <div className="mt-3 max-w-xs mx-auto h-1 bg-border rounded-sm overflow-hidden">
          <div className="h-full bg-primary rounded-sm transition-all" style={{ width: `${progress}%` }} />
        </div>
        <p className="text-xs text-text-secondary mt-1">Meta: {formatBRL(goal)}</p>
      </div>

      <div className="flex gap-2 items-end">
        <div className="flex-1">
          <label className="text-xs font-extralight tracking-[0.08em] uppercase text-text-secondary">Meta semanal (R$)</label>
          <Input type="number" value={meta} onChange={e => setMeta(e.target.value)} step="0.01" className="mt-1" />
        </div>
        <button onClick={updateMeta} className="h-10 px-4 border border-border text-sm hover:border-primary hover:text-primary transition-colors rounded-md">Salvar</button>
      </div>

      <form onSubmit={addLog} className="flex gap-2">
        <Input type="number" value={valor} onChange={e => setValor(e.target.value)} placeholder="Valor rodado hoje" step="0.01" required className="flex-1" />
        <button type="submit" className="h-10 px-4 bg-primary text-primary-foreground font-bold text-sm rounded-md hover:opacity-90 transition-opacity">Registrar</button>
      </form>

      {logs.length > 0 && (
        <div className="bg-surface border border-border rounded-md">
          {logs.map((l: any) => (
            <div key={l.id} className="flex justify-between text-sm px-4 h-10 items-center border-b border-border last:border-b-0">
              <span className="text-text-secondary">{format(new Date(l.data + "T12:00:00"), "dd/MM/yyyy")}</span>
              <span className="font-bold">{formatBRL(Number(l.valor))}</span>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
