import { useState, useEffect, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Plus, Trash2, ChevronDown, ChevronUp, Circle, Square, Triangle, Diamond, ShoppingCart } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";

// ─── Helpers ──────────────────────────────────────
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs font-extralight tracking-[0.08em] uppercase text-text-secondary">{label}</Label>
      {children}
    </div>
  );
}

function MoreDetails({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button type="button" onClick={() => setOpen(!open)} className="flex items-center gap-1 text-xs text-text-secondary hover:text-primary transition-colors">
        <ChevronDown className={`h-3 w-3 transition-transform ${open ? "rotate-180" : ""}`} /> Mais detalhes
      </button>
      {open && <div className="mt-2 space-y-3">{children}</div>}
    </div>
  );
}

const refeicoes = [
  { value: "cafe", label: "Café da manhã", Icon: Circle },
  { value: "almoco", label: "Almoço", Icon: Square },
  { value: "lanche", label: "Lanche", Icon: Triangle },
  { value: "jantar", label: "Jantar", Icon: Diamond },
];

const unidades = [
  { value: "g", label: "g" }, { value: "ml", label: "ml" }, { value: "unidade", label: "unidade" },
  { value: "colher_sopa", label: "colher de sopa" }, { value: "xicara", label: "xícara" }, { value: "fatia", label: "fatia" },
];

export default function DietaPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("dieta");
  const [plans, setPlans] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [obs, setObs] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ refeicao: "cafe", descricao: "" });
  const [expandedMeals, setExpandedMeals] = useState<Record<string, boolean>>({});
  const [pesoHistory, setPesoHistory] = useState<any[]>([]);

  // Food library
  const [foods, setFoods] = useState<any[]>([]);
  const [foodForm, setFoodForm] = useState<any>({});
  const [foodOpen, setFoodOpen] = useState(false);
  const [foodSearch, setFoodSearch] = useState("");
  const [foodSuggestions, setFoodSuggestions] = useState<any[]>([]);

  // Shopping list
  const [shopDays, setShopDays] = useState(7);
  const [shoppingList, setShoppingList] = useState<any[]>([]);
  const [stock, setStock] = useState<Record<string, number>>({});

  const today = format(new Date(), "yyyy-MM-dd");

  useEffect(() => { if (user) loadAll(); }, [user]);

  const loadAll = async () => {
    const [planRes, logRes, pesoRes, foodRes] = await Promise.all([
      supabase.from("meal_plans").select("*").order("created_at"),
      supabase.from("meal_logs").select("*").eq("data", today),
      supabase.from("body_weight_logs").select("*").order("data", { ascending: false }).limit(7),
      supabase.from("food_library").select("*").order("nome"),
    ]);
    setPlans(planRes.data || []);
    setLogs(logRes.data || []);
    setPesoHistory(pesoRes.data || []);
    setFoods(foodRes.data || []);
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

  // Food library
  const addFood = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const { error } = await supabase.from("food_library").insert({
      user_id: user.id, nome: foodForm.nome,
      calorias_por_100g: foodForm.calorias ? Number(foodForm.calorias) : null,
      proteina_por_100g: foodForm.proteina ? Number(foodForm.proteina) : null,
      carboidrato_por_100g: foodForm.carboidrato ? Number(foodForm.carboidrato) : null,
      gordura_por_100g: foodForm.gordura ? Number(foodForm.gordura) : null,
      preco_aproximado: foodForm.preco ? Number(foodForm.preco) : null,
      unidade_padrao: foodForm.unidade || "g",
    });
    if (error) toast.error(error.message);
    else { toast.success("Alimento adicionado!"); setFoodForm({}); setFoodOpen(false); loadAll(); }
  };

  const deleteFood = async (id: string) => {
    await supabase.from("food_library").delete().eq("id", id);
    loadAll();
  };

  // Shopping list calculation
  const calculateShoppingList = () => {
    // Group meal plan items by ingredient/food, multiply by days
    const ingredientMap: Record<string, { nome: string; qty: number; unit: string; preco: number | null }> = {};

    // For now, use meal_plans descriptions as a simple list
    // In full implementation, this would use meal_ingredients table
    plans.forEach(plan => {
      const key = plan.descricao.toLowerCase().trim();
      if (!ingredientMap[key]) {
        ingredientMap[key] = { nome: plan.descricao, qty: shopDays, unit: "porções", preco: null };
      } else {
        ingredientMap[key].qty += shopDays;
      }

      // Check if food exists in library for price
      const food = foods.find(f => f.nome.toLowerCase() === key);
      if (food?.preco_aproximado) {
        ingredientMap[key].preco = food.preco_aproximado;
      }
    });

    setShoppingList(Object.values(ingredientMap));
  };

  const totalCost = shoppingList.reduce((s, item) => s + (item.preco ? item.preco * (item.qty - (stock[item.nome] || 0)) : 0), 0);

  const isChecked = (ref: string) => logs.find(l => l.refeicao === ref)?.concluida || false;
  const concluidas = refeicoes.filter(r => isChecked(r.value)).length;

  // Macros calculation from food library
  const totalCals = foods.reduce((s, f) => s + (f.calorias_por_100g || 0), 0);

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Dieta</h1>
          <p className="text-xs font-extralight tracking-[0.08em] uppercase text-text-secondary mt-1">{concluidas}/{refeicoes.length} refeições feitas hoje</p>
        </div>
        <button onClick={() => setOpen(true)} className="flex items-center gap-1.5 px-4 h-9 text-sm font-bold bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-opacity">
          <Plus className="h-4 w-4" /> Plano
        </button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-transparent border-b border-border rounded-none p-0 h-auto gap-4">
          {[{ v: "dieta", l: "Dieta" }, { v: "biblioteca", l: "Alimentos" }, { v: "compras", l: "Compras" }].map(tab => (
            <TabsTrigger key={tab.v} value={tab.v}
              className="rounded-none border-b-2 border-transparent px-0 pb-2 pt-0 text-sm font-normal text-text-secondary data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none data-[state=active]:bg-transparent">
              {tab.l}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* DIETA TAB */}
        <TabsContent value="dieta" className="mt-4 space-y-4">
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
                        <div key={p.id} className="flex justify-between items-center group">
                          <span className="text-sm text-text-secondary">{p.descricao}</span>
                          <button onClick={() => deletePlan(p.id)} className="p-1 text-text-muted hover:text-destructive transition-colors opacity-0 group-hover:opacity-100">
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
        </TabsContent>

        {/* ALIMENTOS TAB — Food Library */}
        <TabsContent value="biblioteca" className="mt-4 space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-xs font-extralight tracking-[0.08em] uppercase text-text-secondary">Biblioteca de alimentos</p>
            <button onClick={() => setFoodOpen(true)} className="flex items-center gap-1 text-xs px-3 py-1.5 bg-primary text-primary-foreground rounded-md hover:opacity-90">
              <Plus className="h-3 w-3" /> Alimento
            </button>
          </div>

          {foods.length === 0 ? (
            <p className="text-text-secondary text-sm text-center py-8">Nenhum alimento cadastrado. Adicione alimentos para calcular macros e lista de compras.</p>
          ) : (
            <div className="bg-surface border border-border rounded-md">
              {foods.map(f => (
                <div key={f.id} className="flex items-center gap-2 px-4 py-3 border-b border-border last:border-b-0 group">
                  <div className="flex-1">
                    <p className="text-sm">{f.nome}</p>
                    <div className="flex gap-3 text-xs text-text-secondary mt-0.5">
                      {f.calorias_por_100g && <span>{f.calorias_por_100g} kcal</span>}
                      {f.proteina_por_100g && <span>{f.proteina_por_100g}g P</span>}
                      {f.carboidrato_por_100g && <span>{f.carboidrato_por_100g}g C</span>}
                      {f.gordura_por_100g && <span>{f.gordura_por_100g}g G</span>}
                      {f.preco_aproximado && <span>R$ {Number(f.preco_aproximado).toFixed(2)}</span>}
                    </div>
                  </div>
                  <button onClick={() => deleteFood(f.id)} className="p-1 text-text-muted hover:text-destructive transition-colors opacity-0 group-hover:opacity-100">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* COMPRAS TAB */}
        <TabsContent value="compras" className="mt-4 space-y-4">
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <label className="text-xs font-extralight tracking-[0.08em] uppercase text-text-secondary">Dias do plano esta semana</label>
              <Input type="number" min={1} max={7} value={shopDays} onChange={e => setShopDays(Number(e.target.value))} className="mt-1" />
            </div>
            <button onClick={calculateShoppingList}
              className="h-10 px-4 bg-primary text-primary-foreground font-bold text-sm rounded-md hover:opacity-90 transition-opacity flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" /> Calcular lista
            </button>
          </div>

          {shoppingList.length > 0 && (
            <>
              <div className="bg-surface border border-border rounded-md">
                {shoppingList.map((item, i) => {
                  const stockQty = stock[item.nome] || 0;
                  const netQty = Math.max(0, item.qty - stockQty);
                  return (
                    <div key={i} className="flex items-center gap-3 px-4 py-3 border-b border-border last:border-b-0">
                      <div className="flex-1">
                        <p className="text-sm">{item.nome}</p>
                        <p className="text-xs text-text-secondary">{netQty} {item.unit} (preciso {item.qty}, tenho {stockQty})</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min={0}
                          value={stockQty}
                          onChange={e => setStock(prev => ({ ...prev, [item.nome]: Number(e.target.value) }))}
                          placeholder="Tenho"
                          className="w-16 h-8 text-xs"
                        />
                        {item.preco && (
                          <span className="text-xs text-text-secondary">R$ {(item.preco * netQty).toFixed(2)}</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {totalCost > 0 && (
                <div className="flex justify-between items-center bg-surface border border-border rounded-md p-4">
                  <p className="text-sm font-bold">Custo estimado</p>
                  <p className="text-lg font-black text-primary">R$ {totalCost.toFixed(2)}</p>
                </div>
              )}

              <button
                onClick={() => toast.info("Funcionalidade será implementada: lançar como despesa no Financeiro")}
                className="w-full h-10 border border-border text-sm text-text-secondary hover:border-primary hover:text-primary rounded-md transition-colors">
                Lançar como despesa no Financeiro
              </button>
            </>
          )}

          {shoppingList.length === 0 && (
            <p className="text-text-secondary text-sm text-center py-8">Clique em "Calcular lista" para gerar a lista de compras baseada no seu plano alimentar.</p>
          )}
        </TabsContent>
      </Tabs>

      {/* ADD PLAN MODAL */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-surface border-border">
          <DialogHeader><DialogTitle className="font-bold">Novo item do plano alimentar</DialogTitle></DialogHeader>
          <form onSubmit={addPlan} className="space-y-3">
            <Field label="Refeição">
              <div className="flex flex-wrap gap-2">
                {refeicoes.map(r => (
                  <button key={r.value} type="button" onClick={() => setForm({ ...form, refeicao: r.value })}
                    className={`px-3 py-2 text-xs rounded-md border transition-colors ${form.refeicao === r.value ? "bg-primary text-primary-foreground border-primary" : "border-border text-text-secondary"}`}>
                    {r.label}
                  </button>
                ))}
              </div>
            </Field>
            <Field label="Descrição"><Input value={form.descricao} onChange={e => setForm({ ...form, descricao: e.target.value })} required placeholder="Ex: 2 ovos + pão integral" /></Field>
            <button type="submit" className="w-full h-10 bg-primary text-primary-foreground font-bold text-sm rounded-md hover:opacity-90 transition-opacity">Adicionar</button>
          </form>
        </DialogContent>
      </Dialog>

      {/* ADD FOOD MODAL */}
      <Dialog open={foodOpen} onOpenChange={setFoodOpen}>
        <DialogContent className="bg-surface border-border">
          <DialogHeader><DialogTitle className="font-bold">Novo alimento</DialogTitle></DialogHeader>
          <form onSubmit={addFood} className="space-y-3">
            <Field label="Nome"><Input value={foodForm.nome || ""} onChange={e => setFoodForm({ ...foodForm, nome: e.target.value })} required placeholder="Ex: Frango grelhado" /></Field>
            <Field label="Unidade padrão">
              <div className="flex flex-wrap gap-2">
                {unidades.map(u => (
                  <button key={u.value} type="button" onClick={() => setFoodForm({ ...foodForm, unidade: u.value })}
                    className={`px-3 py-1.5 text-xs rounded-md border transition-colors ${(foodForm.unidade || "g") === u.value ? "bg-primary text-primary-foreground border-primary" : "border-border text-text-secondary"}`}>
                    {u.label}
                  </button>
                ))}
              </div>
            </Field>
            <MoreDetails>
              <div className="grid grid-cols-2 gap-2">
                <Field label="Calorias/100g"><Input type="number" value={foodForm.calorias || ""} onChange={e => setFoodForm({ ...foodForm, calorias: e.target.value })} /></Field>
                <Field label="Proteína/100g"><Input type="number" value={foodForm.proteina || ""} onChange={e => setFoodForm({ ...foodForm, proteina: e.target.value })} /></Field>
                <Field label="Carboidrato/100g"><Input type="number" value={foodForm.carboidrato || ""} onChange={e => setFoodForm({ ...foodForm, carboidrato: e.target.value })} /></Field>
                <Field label="Gordura/100g"><Input type="number" value={foodForm.gordura || ""} onChange={e => setFoodForm({ ...foodForm, gordura: e.target.value })} /></Field>
              </div>
              <Field label="Preço aprox. (R$)"><Input type="number" step="0.01" value={foodForm.preco || ""} onChange={e => setFoodForm({ ...foodForm, preco: e.target.value })} /></Field>
            </MoreDetails>
            <button type="submit" className="w-full h-10 bg-primary text-primary-foreground font-bold text-sm rounded-md hover:opacity-90 transition-opacity">Adicionar alimento</button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
