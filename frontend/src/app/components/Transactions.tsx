import { useEffect, useState } from "react";
import { Plus, Search, Filter, X, Check, ArrowUpCircle, ArrowDownCircle, Calendar, Tag, AlignLeft, RefreshCw, ChevronDown } from "lucide-react";
import { formatBRL } from "./ui/formatters";

export interface Transaction {
  id: string;
  type: "receita" | "despesa";
  amount: number;
  category: string;
  description: string;
  date: string;
  recurrence: "unica" | "semanal" | "mensal";
}

interface TransactionsProps {
  transactions: Transaction[];
  userData: { strategy: string; strategyConfig?: { zero_categories?: { id: string; label: string; budget: number; color: string }[] } };
  onAdd: (t: Transaction) => void;
  onDelete: (id: string) => void;
  initialOpenForm?: boolean;
}

const categories = [
  { id: "alimentacao", label: "Alimentação", emoji: "🍽️" },
  { id: "moradia", label: "Moradia", emoji: "🏠" },
  { id: "transporte", label: "Transporte", emoji: "🚗" },
  { id: "saude", label: "Saúde", emoji: "💊" },
  { id: "educacao", label: "Educação", emoji: "📚" },
  { id: "lazer", label: "Lazer", emoji: "🎉" },
  { id: "compras", label: "Compras", emoji: "🛍️" },
  { id: "energia", label: "Energia/Água", emoji: "⚡" },
  { id: "celular", label: "Celular/Internet", emoji: "📱" },
  { id: "salario", label: "Salário", emoji: "💰" },
  { id: "freelance", label: "Freelance", emoji: "💻" },
  { id: "investimento", label: "Investimento", emoji: "📈" },
  { id: "outros", label: "Outros", emoji: "📦" },
];

const defaultZeroCategories = [
  { id: "investimento", label: "Investimento", emoji: "📈" },
  { id: "outros", label: "Outros", emoji: "📦" },
];

const DESCRIPTION_MAX_LENGTH = 80;

const defaultForm = (): Omit<Transaction, "id"> => ({
  type: "despesa",
  amount: 0,
  category: "Alimentação",
  description: "",
  date: new Date().toISOString().split("T")[0],
  recurrence: "unica",
});

export function Transactions({ transactions, userData, onAdd, onDelete, initialOpenForm }: TransactionsProps) {
    const zeroCategories = (userData.strategy === "zero"
    ? userData.strategyConfig?.zero_categories?.map(cat => ({ id: cat.id, label: cat.label, emoji: cat.emoji ?? "📦" }))
    : undefined) ?? defaultZeroCategories;

  const expenseCategories = userData.strategy === "zero"
    ? zeroCategories
    : categories.filter(c => !["salario", "freelance", "investimento"].includes(c.id));

  const incomeCategories = categories.filter(c => ["salario", "freelance", "investimento", "outros"].includes(c.id));

  const [showForm, setShowForm] = useState(initialOpenForm || false);
  const [form, setForm] = useState(() => ({
    ...defaultForm(),
    category: userData.strategy === "zero" ? zeroCategories[0]?.id ?? zeroCategories[0]?.label ?? "outros" : "alimentacao"
  }));

  const allCategories = [...new Map(
    [...categories, ...zeroCategories].map(c => [c.id ?? c.label, c])
  )].map(([, c]) => c);

  const transactionCategoryOptions = userData.strategy === "zero"
    ? zeroCategories
    : categories.filter(c => !["salario", "freelance", "investimento"].includes(c.id));

  const categoryOptions = form.type === "receita" ? incomeCategories : expenseCategories;

  useEffect(() => {
    const options = form.type === "receita" ? incomeCategories : expenseCategories;
    if (!options.some(c => c.id === form.category || c.label === form.category)) {
      setForm(f => ({ ...f, category: options[0]?.id ?? options[0]?.label ?? "outros" }));
    }
  }, [expenseCategories, incomeCategories, form.type]);
  const [amountStr, setAmountStr] = useState("");
  const [filterType, setFilterType] = useState<"all" | "receita" | "despesa">("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [filterMonth, setFilterMonth] = useState(() => new Date().toISOString().slice(0, 7));

  const filtered = transactions.filter(t => {
    const matchType = filterType === "all" || t.type === filterType;
    const matchCat = filterCategory === "all" || t.category === filterCategory;
    const matchSearch = !search || t.description.toLowerCase().includes(search.toLowerCase()) || t.category.toLowerCase().includes(search.toLowerCase());
    const matchMonth = !filterMonth || t.date.startsWith(filterMonth);
    return matchType && matchCat && matchSearch && matchMonth;
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const handleAmountChange = (val: string) => {
    const cleaned = val.replace(/\D/g, "");
    setAmountStr(cleaned);
    setForm(f => ({ ...f, amount: parseInt(cleaned || "0") / 100 }));
  };

  const handleDescriptionChange = (value: string) => {
    const trimmed = value.slice(0, DESCRIPTION_MAX_LENGTH);
    setForm(f => ({ ...f, description: trimmed }));
  };

  const formatAmountDisplay = (str: string) => {
    const num = parseInt(str || "0") / 100;
    return num.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (form.amount <= 0) return;
    const newT: Transaction = { ...form, id: crypto.randomUUID() };
    onAdd(newT);
    setForm({
      ...defaultForm(),
      category: userData.strategy === "zero" ? zeroCategories[0]?.id ?? zeroCategories[0]?.label ?? "outros" : "alimentacao"
    });
    setAmountStr("");
    setShowForm(false);
  };

  const cat = (id: string) => allCategories.find(c => c.id === id || c.label === id);

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-foreground">Transações</h1>
          <p className="text-sm text-muted-foreground">{filtered.length} registros encontrados</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl font-medium text-sm hover:bg-primary/90 transition-all min-h-[44px]"
        >
          <Plus size={16} />
          <span className="hidden sm:inline">Nova</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-card rounded-2xl border border-border p-4 mb-5 space-y-3">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              placeholder="Buscar transações..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-input-background border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <input
            type="month"
            value={filterMonth}
            onChange={e => setFilterMonth(e.target.value)}
            className="px-3 py-2.5 rounded-xl bg-input-background border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 min-h-[44px]"
          />
        </div>

        <div className="flex gap-2 flex-wrap">
          {(["all", "receita", "despesa"] as const).map(t => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all min-h-[32px] ${filterType === t
                ? t === "receita" ? "bg-green-100 text-green-700" : t === "despesa" ? "bg-red-100 text-red-600" : "bg-primary/10 text-primary"
                : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
            >
              {t === "all" ? "Todos" : t === "receita" ? "Receitas" : "Despesas"}
            </button>
          ))}

          <div className="relative">
            <select
              value={filterCategory}
              onChange={e => setFilterCategory(e.target.value)}
              className="appearance-none pl-3 pr-8 py-1.5 rounded-lg bg-muted text-xs font-medium text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 min-h-[32px] cursor-pointer"
            >
              <option value="all">Categorias</option>
              {[...new Map(transactionCategoryOptions.map(c => [c.id ?? c.label, c])).values()].map(c => (
                <option key={c.id ?? c.label} value={c.id ?? c.label}>{c.emoji} {c.label}</option>
              ))}
            </select>
            <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          </div>
        </div>
      </div>

      {/* List */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="bg-card rounded-2xl border border-border p-10 text-center">
            <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-3">
              <Filter size={20} className="text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-foreground">Nenhuma transação encontrada</p>
            <p className="text-xs text-muted-foreground mt-1">Ajuste os filtros ou adicione uma nova transação.</p>
          </div>
        ) : (
          filtered.map(t => {
            const c = cat(t.category);
            return (
              <div key={t.id} className="bg-card rounded-2xl border border-border px-4 py-3 flex items-center gap-3 hover:border-primary/20 transition-all group">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-base shrink-0 ${t.type === "receita" ? "bg-green-100" : "bg-red-50"}`}>
                  {c?.emoji || (t.type === "receita" ? "💰" : "💸")}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-foreground truncate">{t.description || c?.label || "Sem descrição"}</div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-muted-foreground">{new Date(t.date).toLocaleDateString("pt-BR")}</span>
                    <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">{c?.label ?? t.category}</span>
                    {t.recurrence !== "unica" && (
                      <span className="text-[10px] text-accent bg-accent/10 px-1.5 py-0.5 rounded-full flex items-center gap-1">
                        <RefreshCw size={8} /> {t.recurrence}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-bold ${t.type === "receita" ? "text-green-600" : "text-red-500"}`}>
                    {t.type === "receita" ? "+" : "-"}{formatBRL(t.amount)}
                  </span>
                  <button
                    onClick={() => onDelete(t.id)}
                    className="opacity-0 group-hover:opacity-100 w-7 h-7 rounded-lg bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-100 transition-all"
                    aria-label="Excluir"
                  >
                    <X size={12} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end md:items-center justify-center p-4">
          <div className="bg-card rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl animate-in slide-in-from-bottom-4 duration-300">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h2 className="font-bold text-foreground">Nova Transação</h2>
              <button onClick={() => setShowForm(false)} className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {/* Type tabs */}
              <div className="grid grid-cols-2 gap-2 p-1 bg-muted rounded-xl">
                <button
                  type="button"
                  onClick={() => setForm(f => ({ ...f, type: "receita", category: "salario" }))}
                  className={`flex items-center justify-center gap-2 py-2.5 rounded-lg font-semibold text-sm transition-all min-h-[44px] ${form.type === "receita" ? "bg-green-500 text-white shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                >
                  <ArrowUpCircle size={16} /> Receita
                </button>
                <button
                  type="button"
                  onClick={() => setForm(f => ({
                    ...f,
                    type: "despesa",
                    category: userData.strategy === "zero" ? zeroCategories[0]?.id ?? zeroCategories[0]?.label ?? "outros" : "alimentacao"
                  }))}
                  className={`flex items-center justify-center gap-2 py-2.5 rounded-lg font-semibold text-sm transition-all min-h-[44px] ${form.type === "despesa" ? "bg-red-500 text-white shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                >
                  <ArrowDownCircle size={16} /> Despesa
                </button>
              </div>

              {/* Amount */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Valor</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium text-sm">R$</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="0,00"
                    value={formatAmountDisplay(amountStr)}
                    onChange={e => handleAmountChange(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 rounded-xl bg-input-background border border-border text-foreground text-xl font-bold focus:outline-none focus:ring-2 focus:ring-primary/40 text-center"
                  />
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  <Tag size={14} className="inline mr-1.5" />Categoria
                </label>
                <div className="relative">
                  <select
                    value={form.category}
                    onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl bg-input-background border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 appearance-none cursor-pointer"
                  >
                    {categoryOptions.map(c => (
                      <option key={c.id ?? c.label} value={c.id ?? c.label}>{c.emoji} {c.label}</option>
                    ))}
                  </select>
                  <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                </div>
              </div>

              {/* Date */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  <Calendar size={14} className="inline mr-1.5" />Data
                </label>
                <input
                  type="date"
                  value={form.date}
                  onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl bg-input-background border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  <AlignLeft size={14} className="inline mr-1.5" />Descrição <span className="text-muted-foreground font-normal">(opcional)</span>
                </label>
                <input
                  type="text"
                  placeholder="Ex: Supermercado BH, Salário agosto..."
                  value={form.description}
                  maxLength={DESCRIPTION_MAX_LENGTH}
                  onChange={e => handleDescriptionChange(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-input-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
                <p className="mt-2 text-[11px] text-muted-foreground">{form.description.length}/{DESCRIPTION_MAX_LENGTH} caracteres</p>
              </div>

              {/* Recurrence */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  <RefreshCw size={14} className="inline mr-1.5" />Recorrência
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(["unica", "semanal", "mensal"] as const).map(r => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, recurrence: r }))}
                      className={`py-2.5 rounded-xl text-xs font-medium transition-all min-h-[44px] ${form.recurrence === r ? "bg-primary/10 text-primary border border-primary/30" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
                    >
                      {r === "unica" ? "Única" : r === "semanal" ? "Semanal" : "Mensal"}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={form.amount <= 0}
                className={`w-full py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all min-h-[44px] ${form.amount > 0 ? "bg-primary text-white hover:bg-primary/90 active:scale-[0.98]" : "bg-muted text-muted-foreground cursor-not-allowed"}`}
              >
                <Check size={16} />
                Salvar Transação
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
