import { useEffect, useState } from "react";
import { TrendingUp, TrendingDown, Wallet, Plus, Bell, AlertTriangle, Lightbulb, Coffee, ShoppingBag, Car, Home, Zap, Smartphone, UtensilsCrossed, ArrowUpCircle, ArrowDownCircle, Moon, Sun, Settings, Trash2 } from "lucide-react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { formatBRL } from "./ui/formatters";
import type { OnboardingData } from "./OnboardingScreen";
import type { Transaction } from "./Transactions";
import * as api from "../api";

interface DashboardProps {
  primaryGoal: string;
  userData: OnboardingData;
  transactions: Transaction[];
  onNewTransaction: () => void;
  onNavigate: (page: string) => void;
  theme: "light" | "dark";
  onToggleTheme: () => void;
  onUpdateStrategyConfig?: (config: { strategy: string; zero_categories: Array<{ id: string; label: string; budget: number; color: string }> }) => void;
}

const categoryIcons: Record<string, React.ReactNode> = {
  alimentacao: <UtensilsCrossed size={16} />,
  moradia: <Home size={16} />,
  transporte: <Car size={16} />,
  lazer: <Coffee size={16} />,
  compras: <ShoppingBag size={16} />,
  energia: <Zap size={16} />,
  celular: <Smartphone size={16} />,
  outros: <Wallet size={16} />,
};

const categoryLabels: Record<string, string> = {
  alimentacao: "Alimentação",
  moradia: "Moradia",
  transporte: "Transporte",
  lazer: "Lazer",
  compras: "Compras",
  energia: "Energia/Água",
  celular: "Celular/Internet",
  outros: "Outros",
};

const categoryColors: Record<string, string> = {
  alimentacao: "#1a7f5a",
  moradia: "#7c3aed",
  transporte: "#f59e0b",
  lazer: "#3b82f6",
  compras: "#ec4899",
  energia: "#14b8a6",
  celular: "#f97316",
  outros: "#94a3b8",
};

const zeroColorClassToHex: Record<string, string> = {
  "bg-primary": "#1a7f5a",
  "bg-blue-500": "#3b82f6",
  "bg-accent": "#7c3aed",
  "bg-yellow-500": "#f59e0b",
  "bg-violet-500": "#8b5cf6",
  "bg-emerald-500": "#10b981",
};

const primaryGoalConfig: Record<string, { label: string; emoji: string; description: string; color: string }> = {
  reserve: { label: "Reserva de Emergência", emoji: "🛡️", description: "Pilha de segurança para imprevistos. Priorize esse fundo antes de despesas extras.", color: "bg-primary" },
  debts: { label: "Quitar Dívidas", emoji: "💳", description: "Reduza juros e libere margem de manobra. Pague primeiro as dívidas mais caras.", color: "bg-red-500" },
  invest: { label: "Investimento", emoji: "📈", description: "Comece com pequenas aplicações regulares e deixe o tempo trabalhar a seu favor.", color: "bg-yellow-500" },
  goals: { label: "Realizar Sonhos", emoji: "🎯", description: "Transforme um sonho em meta concreta com prazos e valores definidos.", color: "bg-accent" },
};

function getHealthStatus(balance: number, income: number): { label: string; color: string; bg: string } {
  if (balance >= income * 0.2) return { label: "Saudável 💚", color: "text-green-700", bg: "bg-green-100" };
  if (balance >= 0) return { label: "Atenção ⚠️", color: "text-yellow-700", bg: "bg-yellow-100" };
  return { label: "Crítico 🔴", color: "text-red-700", bg: "bg-red-100" };
}

export function Dashboard({ primaryGoal, userData, transactions, onNewTransaction, onNavigate, theme, onToggleTheme, onUpdateStrategyConfig }: DashboardProps) {
  const currentMonth = new Date().toLocaleString("pt-BR", { month: "long", year: "numeric" });

  const now = new Date();
  const monthTransactions = transactions.filter(t => {
    const d = new Date(t.date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });

  const totalIncome = monthTransactions.filter(t => t.type === "receita").reduce((s, t) => s + t.amount, 0);
  const totalExpenses = monthTransactions.filter(t => t.type === "despesa").reduce((s, t) => s + t.amount, 0);
  const balance = totalIncome - totalExpenses;

  const parseIncomeValue = (income: string) => {
    const normalized = income
      .trim()
      .replace(/\s/g, "")
      .replace(/R\$/gi, "")
      .replace(/\./g, "")
      .replace(/,/g, ".");
    const numberValue = Number(normalized);
    return Number.isFinite(numberValue) && numberValue >= 0 ? numberValue : 0;
  };

  const incomeValue = (() => {
    const map: Record<string, number> = {
      "Até R$ 1.500": 1500,
      "R$ 1.500 a R$ 3.000": 2250,
      "R$ 3.000 a R$ 6.000": 4500,
      "R$ 6.000 a R$ 12.000": 9000,
      "Acima de R$ 12.000": 15000,
    };
    if (userData.income && map[userData.income]) return map[userData.income];
    return parseIncomeValue(userData.income) || 3000;
  })();

  const incomeLabel = userData.income && incomeValue > 0 ? formatBRL(incomeValue) : "R$ 0,00";

  interface ZeroCategory { id: string; label: string; budget: number; color: string; emoji: string; }
  const [zeroCategories, setZeroCategories] = useState<ZeroCategory[]>([]);
  const [zeroDraftCategories, setZeroDraftCategories] = useState<ZeroCategory[]>([]);
  const [zeroNameInput, setZeroNameInput] = useState("");
  const [zeroEmojiInput, setZeroEmojiInput] = useState("📦");
  const [zeroColorInput, setZeroColorInput] = useState("bg-primary");
  const [zeroBudgetInput, setZeroBudgetInput] = useState("");
  const [zeroLoaded, setZeroLoaded] = useState(false);
  const [zeroValidationMessage, setZeroValidationMessage] = useState("");

  const emojiOptions = [
    "📦", "🍽️", "🏠", "🚗", "💡", "🎯", "💻", "📚", "⚡", "📱", "🛍️", "💰", "🧾"
  ];

  const normalizeCategoryKey = (label: string) => label.toLowerCase().replace(/[^a-z0-9]+/g, "").trim();
  const zeroSpendByLabel = (label: string) => {
    const key = normalizeCategoryKey(label);
    return monthTransactions
      .filter(t => t.type === "despesa" && normalizeCategoryKey(categoryLabels[t.category] ?? t.category) === key)
      .reduce((s, t) => s + t.amount, 0);
  };

  const zeroColorOptions = ["bg-primary", "bg-blue-500", "bg-accent", "bg-yellow-500", "bg-violet-500", "bg-emerald-500"];
  const zeroColorLabel: Record<string, string> = {
    "bg-primary": "Primária",
    "bg-blue-500": "Azul",
    "bg-accent": "Acento",
    "bg-yellow-500": "Amarela",
    "bg-violet-500": "Violeta",
    "bg-emerald-500": "Esmeralda",
  };

  const normalizeCategoryColor = (color: string) => {
    if (color.startsWith("#")) return color;
    return zeroColorClassToHex[color] ?? "#94a3b8";
  };

  const zeroCategoryColorMap = Object.fromEntries(zeroCategories.flatMap(cat => [
    [cat.id, normalizeCategoryColor(cat.color)],
    [cat.label, normalizeCategoryColor(cat.color)],
  ]));
  const zeroCategoriesStorageKey = userData.email
    ? `helpfinance_zero_categories_${userData.email.toLowerCase()}`
    : "helpfinance_zero_categories";

  const defaultZeroCategories = [
    { id: "investimento", label: "Investimento", budget: incomeValue * 0.5, color: "bg-emerald-500", emoji: "📈" },
    { id: "outros", label: "Outros", budget: incomeValue * 0.5, color: "bg-yellow-500", emoji: "📦" },
  ];

  useEffect(() => {
    if (userData.strategy === "zero") {
      const serverCategories = userData.strategyConfig?.zero_categories ?? (userData as any).config_estrategia?.zero_categories;
      if (Array.isArray(serverCategories) && serverCategories.every(cat => typeof cat.id === "string" && typeof cat.label === "string" && typeof cat.budget === "number" && typeof cat.color === "string" && typeof cat.emoji === "string")) {
        setZeroCategories(serverCategories.map(cat => ({ emoji: cat.emoji ?? "📦", color: cat.color, ...cat })));
      } else {
        const savedCategories = localStorage.getItem(zeroCategoriesStorageKey);
        if (savedCategories) {
          try {
            const parsed: ZeroCategory[] = JSON.parse(savedCategories);
            if (Array.isArray(parsed) && parsed.every(cat => typeof cat.id === "string" && typeof cat.label === "string" && typeof cat.budget === "number" && typeof cat.color === "string" && typeof cat.emoji === "string")) {
              setZeroCategories(parsed.map(cat => ({ emoji: cat.emoji ?? "📦", color: cat.color, ...cat })));
            } else {
              setZeroCategories(defaultZeroCategories);
            }
          } catch {
            setZeroCategories(defaultZeroCategories);
          }
        } else {
          setZeroCategories(defaultZeroCategories);
        }
      }
      setZeroLoaded(true);
    } else {
      setZeroLoaded(false);
      setZeroCategories([]);
      setZeroDraftCategories([]);
    }
  }, [userData.strategy, userData.strategyConfig, incomeValue]);

  useEffect(() => {
    if (userData.strategy === "zero") {
      localStorage.setItem(zeroCategoriesStorageKey, JSON.stringify(zeroCategories));
    }
  }, [zeroCategories, userData.strategy, zeroCategoriesStorageKey]);

  const addZeroCategory = () => {
    const budget = parseFloat(zeroBudgetInput.replace(/,/g, "."));
    const currentTotal = zeroDraftCategories.reduce((sum, cat) => sum + cat.budget, 0);
    const remaining = incomeValue - currentTotal;
    if (!zeroNameInput.trim()) {
      setZeroValidationMessage("Informe o nome da categoria.");
      return;
    }
    if (Number.isNaN(budget) || budget <= 0) {
      setZeroValidationMessage("Informe um valor de orçamento válido maior que zero.");
      return;
    }
    if (budget > remaining) {
      setZeroValidationMessage(`O valor não pode ultrapassar o saldo restante: ${formatBRL(remaining)}.`);
      return;
    }
    setZeroValidationMessage("");
    setZeroDraftCategories(prev => [
      ...prev,
      {
        id: crypto.randomUUID(),
        label: zeroNameInput.trim(),
        budget,
        color: zeroColorInput,
        emoji: zeroEmojiInput,
      },
    ]);
    setZeroNameInput("");
    setZeroBudgetInput("");
    setZeroEmojiInput("📦");
    setZeroColorInput("bg-primary");
  };

  const updateZeroCategory = (id: string, field: "label" | "budget" | "emoji" | "color", value: string | number) => {
    setZeroDraftCategories(prev => {
      const budgetValue = field === "budget" ? Number(value) : undefined;
      if (field === "budget" && (Number.isNaN(budgetValue) || budgetValue < 0)) {
        setZeroValidationMessage("Informe um valor de orçamento válido maior que zero.");
        return prev;
      }
      const otherTotal = prev.filter(cat => cat.id !== id).reduce((sum, cat) => sum + cat.budget, 0);
      if (field === "budget" && budgetValue !== undefined && otherTotal + budgetValue > incomeValue) {
        setZeroValidationMessage(`O valor não pode ultrapassar a renda total: ${formatBRL(incomeValue)}.`);
        return prev;
      }
      setZeroValidationMessage("");
      return prev.map(cat => cat.id === id ? {
        ...cat,
        [field]: field === "budget" ? Number(value) : String(value)
      } : cat);
    });
  };

  const removeZeroCategory = (id: string) => {
    setZeroDraftCategories(prev => prev.filter(cat => cat.id !== id));
  };

  const [customLimits, setCustomLimits] = useState<Record<string, number>>({});
  const [customizingStrategy, setCustomizingStrategy] = useState(false);

  const displayedZeroCategories = userData.strategy === "zero" && customizingStrategy ? zeroDraftCategories : zeroCategories;
  const zeroBudgetTotal = displayedZeroCategories.reduce((sum, item) => sum + item.budget, 0);
  const zeroRemaining = incomeValue - zeroBudgetTotal;
  const zeroStrategyItems = displayedZeroCategories.map(item => ({
    id: item.id,
    label: item.label,
    pct: incomeValue > 0 ? `${Math.round((item.budget / incomeValue) * 100)}%` : "0%",
    spent: zeroSpendByLabel(item.label),
    limit: item.budget,
    color: item.color,
  }));

  const goalInfo = primaryGoalConfig[primaryGoal] ?? primaryGoalConfig[userData.goal] ?? primaryGoalConfig.reserve;
  const goalPhrase = goalInfo.label.toLowerCase();

  const essential = incomeValue * 0.5;
  const desire = incomeValue * 0.3;
  const priority = incomeValue * 0.2;

  const expensesByType = (type: "essential" | "desire" | "priority") => {
    const essentialCats = ["moradia", "energia", "celular", "transporte", "alimentacao"];
    const desireCats = ["lazer", "compras"];
    const priorityCats = ["outros"];
    const filter = type === "essential" ? essentialCats : type === "desire" ? desireCats : priorityCats;
    return monthTransactions.filter(t => t.type === "despesa" && filter.includes(t.category)).reduce((s, t) => s + t.amount, 0);
  };

  const essentialSpent = expensesByType("essential");
  const desireSpent = expensesByType("desire");
  const prioritySpent = expensesByType("priority");

  const getBarWidth = (spent: number, limit: number) => Math.min((spent / limit) * 100, 100);
  const getBarColor = (spent: number, limit: number) => {
    const pct = spent / limit;
    if (pct >= 1) return "bg-red-500";
    if (pct >= 0.8) return "bg-yellow-500";
    return "bg-primary";
  };

  // Pie chart data
  const catSpend = monthTransactions
    .filter(t => t.type === "despesa")
    .reduce((acc, t) => { acc[t.category] = (acc[t.category] || 0) + t.amount; return acc; }, {} as Record<string, number>);
  const pieData = Object.entries(catSpend).map(([id, value]) => ({ id, name: categoryLabels[id] ?? id, value }));

  const zeroCategorySpend = (category: string) =>
    monthTransactions
      .filter(t => t.type === "despesa" && t.category === category)
      .reduce((s, t) => s + t.amount, 0);

  const zeroMoradia = zeroCategorySpend("moradia");
  const zeroAlimentacao = zeroCategorySpend("alimentacao");
  const zeroTransporte = zeroCategorySpend("transporte");
  const zeroOutros = totalExpenses - zeroMoradia - zeroAlimentacao - zeroTransporte;

  const strategyConfig: Record<string, { title: string; subtitle: string; items: Array<{ label: string; pct: string; spent: number; limit: number; color: string }> }> = {
    "50-30-20": {
      title: "Estratégia 50-30-20",
      subtitle: "Baseado na renda de",
      items: [
        { label: "Essenciais", pct: "50%", spent: essentialSpent, limit: essential, color: "bg-primary" },
        { label: "Desejos", pct: "30%", spent: desireSpent, limit: desire, color: "bg-accent" },
        { label: "Prioridades", pct: "20%", spent: prioritySpent, limit: priority, color: "bg-blue-500" },
      ],
    },
    "80-20": {
      title: "Estratégia 80-20",
      subtitle: "Baseado na renda de",
      items: [
        { label: "Gastos", pct: "80%", spent: totalExpenses, limit: incomeValue * 0.8, color: "bg-accent" },
        { label: "Poupança", pct: "20%", spent: Math.max(0, totalIncome - totalExpenses), limit: incomeValue * 0.2, color: "bg-blue-500" },
      ],
    },
    zero: {
      title: "Orçamento Base Zero",
      subtitle: "Distribua cada real da renda",
      items: [
        { label: "Moradia", pct: "30%", spent: zeroMoradia, limit: incomeValue * 0.3, color: "bg-primary" },
        { label: "Alimentação", pct: "20%", spent: zeroAlimentacao, limit: incomeValue * 0.2, color: "bg-blue-500" },
        { label: "Transporte", pct: "10%", spent: zeroTransporte, limit: incomeValue * 0.1, color: "bg-accent" },
        { label: "Outros", pct: "40%", spent: Math.max(0, zeroOutros), limit: incomeValue * 0.4, color: "bg-yellow-500" },
      ],
    },
  };
  const strategy = strategyConfig[userData.strategy] ?? strategyConfig["50-30-20"];
  const strategyTotal = incomeValue;

  const strategyItemWeight = (item: { pct: string }) => Number(item.pct.replace("%", "")) || 0;

  const resetCustomLimits = () => {
    const counts: Record<string, number> = {};
    strategy.items.forEach(item => {
      counts[item.label] = item.limit;
    });
    setCustomLimits(counts);
  };

  useEffect(() => {
    resetCustomLimits();
    setCustomizingStrategy(false);
  }, [strategy.title]);

  const handleLimitChange = (label: string, value: number) => {
    const inputValue = Number.isNaN(value) ? 0 : value;
    const clampedValue = Math.max(0, Math.min(inputValue, strategyTotal));
    const totalRemaining = Math.max(strategyTotal - clampedValue, 0);
    const otherItems = strategy.items.filter(item => item.label !== label);
    const otherWeightSum = otherItems.reduce((sum, item) => sum + strategyItemWeight(item), 0);

    const updatedLimits: Record<string, number> = {};
    let assignedSum = 0;

    strategy.items.forEach(item => {
      if (item.label === label) {
        updatedLimits[item.label] = Number(clampedValue.toFixed(2));
      } else {
        const weight = strategyItemWeight(item);
        const itemValue = otherWeightSum > 0
          ? Number(((weight / otherWeightSum) * totalRemaining).toFixed(2))
          : 0;
        updatedLimits[item.label] = itemValue;
        assignedSum += itemValue;
      }
    });

    if (otherItems.length > 0) {
      const lastLabel = otherItems[otherItems.length - 1].label;
      const difference = Number((strategyTotal - clampedValue - assignedSum).toFixed(2));
      updatedLimits[lastLabel] = Number((updatedLimits[lastLabel] + difference).toFixed(2));
    }

    setCustomLimits(updatedLimits);
  };

  const handleConfirmCustomization = () => {
    setCustomizingStrategy(false);
  };

  const handleSaveZeroCustomization = async () => {
    try {
      await api.updateMe({ config_estrategia: { strategy: "zero", zero_categories: zeroDraftCategories } });
      setZeroCategories(zeroDraftCategories);
      onUpdateStrategyConfig?.({ strategy: "zero", zero_categories: zeroDraftCategories });
      setCustomizingStrategy(false);
      setZeroValidationMessage("");
    } catch (error) {
      console.error("Erro ao salvar categorias Base Zero:", error);
      setZeroValidationMessage("Não foi possível salvar as categorias. Tente novamente.");
    }
  };

  const toggleCustomization = () => {
    if (userData.strategy === "zero") {
      setZeroDraftCategories(zeroCategories.map(cat => ({ ...cat })));
    }
    if (customizingStrategy && userData.strategy !== "zero") {
      resetCustomLimits();
    }
    setCustomizingStrategy(prev => !prev);
  };

  const getLimitValue = (label: string, defaultValue: number) => {
    return customLimits[label] ?? defaultValue;
  };

  const health = getHealthStatus(balance, incomeValue);
  const recent = [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);

  const tips = [
    { condition: balance < 0, msg: `Suas despesas ultrapassaram sua renda. Para alcançar ${goalPhrase}, reorganize os gastos e priorize o essencial.` },
    { condition: desireSpent / desire >= 0.8, msg: `Você já consumiu ${Math.round((desireSpent / desire) * 100)}% do orçamento de Desejos. Reduzir esses gastos ajuda sua ${goalPhrase}.` },
    { condition: essentialSpent / essential >= 0.8, msg: `Gastos essenciais estão em ${Math.round((essentialSpent / essential) * 100)}%. Revisar contas fixas libera mais espaço para sua ${goalPhrase}.` },
    { condition: totalExpenses > incomeValue * 0.6, msg: `Seu gasto total está alto comparado à renda. Ajustar seu orçamento pode acelerar ${goalPhrase}.` },
    { condition: true, msg: `Para manter o foco em ${goalPhrase}, revise pequenas despesas semanalmente e acompanhe seu progresso.` },
  ];
  const activeTip = tips.find(t => t.condition)!;

  const strategyLabel = userData.strategy || "50-30-20";
  const balanceColor = balance >= 0 ? "text-emerald-500" : "text-red-500";
  const balanceBg = balance >= 0 ? "bg-emerald-100" : "bg-red-100";

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-muted-foreground text-sm">Olá, {userData.name || "Usuário"} 👋</p>
          <h1 className="text-xl font-bold text-foreground capitalize">{currentMonth}</h1>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={onToggleTheme} className="w-10 h-10 rounded-xl bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors" title="Alternar modo claro/escuro">
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button
            type="button"
            onClick={() => onNavigate("settings")}
            className="w-10 h-10 rounded-xl bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors md:hidden"
            title="Configurações"
          >
            <Settings size={18} />
          </button>
          <button className="w-10 h-10 rounded-xl bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
            <Bell size={18} />
          </button>
          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-bold text-sm">
            {userData.name?.charAt(0)?.toUpperCase() || "U"}
          </div>
        </div>
      </div>

      {/* Balance cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <div className={`rounded-2xl p-5 ${balanceBg} border ${balance >= 0 ? "border-emerald-200" : "border-red-200"}`}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-slate-950 font-medium">Saldo Atual</span>
            <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${health.bg} ${health.color}`}>{health.label}</span>
          </div>
          <div className={`text-2xl font-bold mb-1 ${balanceColor}`}>{formatBRL(balance)}</div>
          <div className="text-xs text-slate-950">Receitas − Despesas do mês</div>
        </div>

        <div className="bg-card rounded-2xl p-5 border border-border">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
              <TrendingUp size={16} className="text-green-600" />
            </div>
            <span className="text-sm text-muted-foreground font-medium">Receitas</span>
          </div>
          <div className="text-xl font-bold text-green-600">{formatBRL(totalIncome)}</div>
          <div className="text-xs text-muted-foreground mt-1">Mês atual</div>
        </div>

        <div className="bg-card rounded-2xl p-5 border border-border">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
              <TrendingDown size={16} className="text-red-500" />
            </div>
            <span className="text-sm text-muted-foreground font-medium">Despesas</span>
          </div>
          <div className="text-xl font-bold text-red-500">{formatBRL(totalExpenses)}</div>
          <div className="text-xs text-muted-foreground mt-1">Mês atual</div>
        </div>

        <div className="bg-card rounded-2xl p-5 border border-border">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
              <Wallet size={16} className="text-blue-600" />
            </div>
            <span className="text-sm text-muted-foreground font-medium">Minha Renda</span>
          </div>
          <div className="text-xl font-bold text-foreground">{incomeLabel}</div>
          <div className="text-xs text-muted-foreground mt-1">Valor usado nos cálculos</div>
        </div>
      </div>

      {goalInfo && (
        <div className="bg-card rounded-2xl border border-border p-5 mb-6">
          <div className="flex items-start gap-4">
            <div className={`w-14 h-14 rounded-3xl ${goalInfo.color} flex items-center justify-center text-2xl`}>
              {goalInfo.emoji}
            </div>
            <div className="flex-1">
              <p className="text-xs uppercase tracking-[0.28em] text-primary font-semibold">Meta principal</p>
              <h2 className="mt-3 text-lg font-semibold text-foreground">{goalInfo.label}</h2>
              <p className="text-sm text-muted-foreground mt-2">{goalInfo.description}</p>
            </div>
          </div>
        </div>
      )}

      {/* 50-30-20 Strategy */}
      <div className="bg-card rounded-2xl p-5 border border-border mb-6">
        <div className="flex items-center justify-between mb-4 gap-4">
          <div>
            <h3 className="font-semibold text-foreground">{strategy.title}</h3>
            <p className="text-xs text-muted-foreground">{strategy.subtitle} {formatBRL(incomeValue)}</p>
          </div>
          <button
            type="button"
            onClick={toggleCustomization}
            className="text-xs font-semibold text-primary hover:underline"
          >
            {customizingStrategy ? "Cancelar personalização" : "Personalizar valores"}
          </button>
        </div>

        <div className="space-y-4">
          {(userData.strategy === "zero" ? zeroStrategyItems : strategy.items).map(item => {
            const currentLimit = getLimitValue(item.label, item.limit);
            const barPct = getBarWidth(item.spent, currentLimit);
            const barColor = getBarColor(item.spent, currentLimit);
            const isOver = currentLimit > 0 && item.spent >= currentLimit;
            const isNear = currentLimit > 0 && item.spent / currentLimit >= 0.8 && !isOver;
            return (
              <div key={item.label}>
                <div className="flex items-center justify-between mb-1.5 gap-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-foreground">{item.label}</span>
                    <span className="text-xs text-muted-foreground">{item.pct}</span>
                    {isOver && <span className="flex items-center gap-1 text-xs text-red-600 bg-red-50 px-1.5 py-0.5 rounded-full"><AlertTriangle size={10} /> Excedeu</span>}
                    {isNear && <span className="flex items-center gap-1 text-xs text-yellow-600 bg-yellow-50 px-1.5 py-0.5 rounded-full"><AlertTriangle size={10} /> 80%+</span>}
                  </div>
                  <span className="text-xs text-muted-foreground">{formatBRL(item.spent)} / {formatBRL(currentLimit)}</span>
                </div>
                <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-700 ${barColor}`} style={{ width: `${barPct}%` }} />
                </div>
              </div>
            );
          })}
        </div>

        {userData.strategy === "zero" && customizingStrategy ? (
          <div className="mt-6 rounded-2xl border border-border bg-background p-4 space-y-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-semibold text-foreground">Categorias do Orçamento Base Zero</p>
                <p className="text-xs text-muted-foreground">Adicione, edite ou remova categorias para distribuir seu orçamento do jeito que funciona para você.</p>
              </div>
              <div className="text-right text-xs text-muted-foreground">
                <div>Total alocado: {formatBRL(zeroBudgetTotal)}</div>
                <div className={zeroRemaining < 0 ? "text-red-500" : "text-foreground"}>Restante: {formatBRL(zeroRemaining)}</div>
              </div>
            </div>

            <div className="space-y-3">
              {zeroDraftCategories.map(category => {
                const spent = zeroSpendByLabel(category.label);
                const pct = incomeValue > 0 ? `${Math.round((category.budget / incomeValue) * 100)}%` : "0%";
                const barPct = getBarWidth(spent, category.budget);
                const barColor = getBarColor(spent, category.budget);
                const isOver = category.budget > 0 && spent >= category.budget;
                const isNear = category.budget > 0 && spent / category.budget >= 0.8 && !isOver;
                return (
                  <div key={category.id} className="rounded-2xl border border-border p-4 bg-card">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-3">
                          <span className={`inline-flex h-2.5 w-2.5 rounded-full ${category.color}`} />
                          <span className="text-sm font-semibold text-foreground">{category.label}</span>
                          <span className="text-xs text-muted-foreground">{pct}</span>
                          {isOver && <span className="flex items-center gap-1 text-xs text-red-600 bg-red-50 px-2 py-0.5 rounded-full"><AlertTriangle size={10} /> Excedeu</span>}
                          {isNear && <span className="flex items-center gap-1 text-xs text-yellow-600 bg-yellow-50 px-2 py-0.5 rounded-full"><AlertTriangle size={10} /> 80%+</span>}
                        </div>
                        <div className="grid gap-3 md:grid-cols-4">
                          <label className="text-sm text-foreground">
                            <span className="block mb-2 font-medium">Nome da categoria</span>
                            <input
                              type="text"
                              value={category.label}
                              onChange={e => updateZeroCategory(category.id, "label", e.target.value)}
                              className="w-full rounded-xl border border-border bg-input-background px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                            />
                          </label>
                          <label className="text-sm text-foreground">
                            <span className="block mb-2 font-medium">Emoji</span>
                            <select
                              value={category.emoji}
                              onChange={e => updateZeroCategory(category.id, "emoji", e.target.value)}
                              className="w-full rounded-xl border border-border bg-input-background px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                            >
                              {["📦", "🍽️", "🏠", "🚗", "💡", "🎯", "💻", "📚", "⚡", "📱", "🛍️", "💰", "🧾"].map(emoji => (
                                <option key={emoji} value={emoji}>{emoji}</option>
                              ))}
                            </select>
                          </label>
                          <label className="text-sm text-foreground">
                            <span className="block mb-2 font-medium">Cor</span>
                            <select
                              value={category.color}
                              onChange={e => updateZeroCategory(category.id, "color", e.target.value)}
                              className="w-full rounded-xl border border-border bg-input-background px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                            >
                              {zeroColorOptions.map(color => (
                                <option key={color} value={color}>{zeroColorLabel[color] ?? color}</option>
                              ))}
                            </select>
                          </label>
                          <label className="text-sm text-foreground">
                            <span className="block mb-2 font-medium">Orçamento</span>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={category.budget}
                              onChange={e => updateZeroCategory(category.id, "budget", Number(e.target.value))}
                              className="w-full rounded-xl border border-border bg-input-background px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                            />
                          </label>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeZeroCategory(category.id)}
                        className="h-10 w-10 rounded-xl border border-border bg-background text-red-600 hover:bg-red-50 transition-colors flex items-center justify-center"
                        aria-label={`Remover categoria ${category.label}`}
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                    <div className="mt-3 text-xs text-muted-foreground">Gasto até agora: {formatBRL(spent)} / {formatBRL(category.budget)}</div>
                    <div className="mt-2 h-2.5 bg-muted rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-700 ${barColor}`} style={{ width: `${barPct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="rounded-2xl border border-border bg-background p-4">
              <p className="text-sm font-semibold text-foreground mb-3">Adicionar nova categoria</p>
              <div className="grid gap-3 md:grid-cols-4">
                <label className="text-sm text-foreground">
                  <span className="block mb-2 font-medium">Nome da categoria</span>
                  <input
                    type="text"
                    value={zeroNameInput}
                    onChange={e => setZeroNameInput(e.target.value)}
                    placeholder="Ex: Transporte extra"
                    className="w-full rounded-xl border border-border bg-input-background px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </label>
                <label className="text-sm text-foreground">
                  <span className="block mb-2 font-medium">Emoji</span>
                  <select
                    value={zeroEmojiInput}
                    onChange={e => setZeroEmojiInput(e.target.value)}
                    className="w-full rounded-xl border border-border bg-input-background px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                  >
                    {["📦", "🍽️", "🏠", "🚗", "💡", "🎯", "💻", "📚", "⚡", "📱", "🛍️", "💰", "🧾"].map(emoji => (
                      <option key={emoji} value={emoji}>{emoji}</option>
                    ))}
                  </select>
                </label>
                <label className="text-sm text-foreground">
                  <span className="block mb-2 font-medium">Cor</span>
                  <select
                    value={zeroColorInput}
                    onChange={e => setZeroColorInput(e.target.value)}
                    className="w-full rounded-xl border border-border bg-input-background px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                  >
                    {zeroColorOptions.map(color => (
                      <option key={color} value={color}>{zeroColorLabel[color] ?? color}</option>
                    ))}
                  </select>
                </label>
                <label className="text-sm text-foreground">
                  <span className="block mb-2 font-medium">Orçamento</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={zeroBudgetInput}
                    onChange={e => setZeroBudgetInput(e.target.value)}
                    placeholder="R$"
                    className="w-full rounded-xl border border-border bg-input-background px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </label>
              </div>
              <div className="flex items-end">
                <button
                  type="button"
                  onClick={addZeroCategory}
                  className="w-full rounded-2xl bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90 transition-all"
                >
                  Adicionar categoria
                </button>
              </div>
              {zeroValidationMessage && (
                <p className="mt-3 text-sm text-red-600">{zeroValidationMessage}</p>
              )}
            </div>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={toggleCustomization}
                className="rounded-2xl border border-border bg-background px-4 py-2 text-sm font-semibold text-foreground hover:bg-muted transition-all"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveZeroCustomization}
                className="rounded-2xl bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90 transition-all"
              >
                Salvar alterações
              </button>
            </div>
          </div>
        ) : (
          customizingStrategy && (
            <div className="mt-6 rounded-2xl border border-border bg-background p-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm font-semibold text-foreground">Valores personalizados</p>
                  <p className="text-xs text-muted-foreground">Ao alterar um valor, os demais se ajustam proporcionalmente para manter o total da estratégia.</p>
                </div>
                <span className="text-xs text-muted-foreground">Total: {formatBRL(strategyTotal)}</span>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                {strategy.items.map(item => (
                  <label key={item.label} className="text-sm text-foreground">
                    <span className="block mb-2 font-medium">{item.label}</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max={strategyTotal}
                      value={getLimitValue(item.label, item.limit)}
                      onChange={e => handleLimitChange(item.label, Number(e.target.value))}
                      className="w-full rounded-xl border border-border bg-input-background px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                    />
                  </label>
                ))}
              </div>
              <div className="mt-4 flex justify-end">
                <button
                  type="button"
                  onClick={handleConfirmCustomization}
                  className="rounded-2xl bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90 transition-all"
                >
                  Confirmar alterações
                </button>
              </div>
            </div>
          )
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Donut chart */}
        <div className="bg-card rounded-2xl p-5 border border-border">
          <h3 className="font-semibold text-foreground mb-4">Despesas por Categoria</h3>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={3}
                  minAngle={4}
                  dataKey="value"
                  nameKey="name"
                  stroke="var(--card)"
                  strokeWidth={2}
                  label={({ percent }) => (percent >= 0.04 ? `${Math.round(percent * 100)}%` : "")}
                  labelLine={false}
                >
                  {pieData.map((entry) => (
                    <Cell key={entry.id} fill={(zeroCategoryColorMap[entry.id] ?? categoryColors[entry.id]) || "#94a3b8"} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => formatBRL(value)}
                  contentStyle={{ backgroundColor: "var(--card)", borderColor: "var(--border)", color: "var(--foreground)" }}
                  itemStyle={{ color: "var(--foreground)" }}
                  cursor={{ fill: "rgba(0,0,0,0.05)" }}
                />
                <Legend
                  formatter={(value) => value}
                  iconSize={10}
                  iconType="circle"
                  wrapperStyle={{ color: "var(--foreground)", marginTop: 8 }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[200px] flex items-center justify-center">
              <div className="text-center">
                <Wallet size={32} className="text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Nenhuma despesa ainda.</p>
                <p className="text-xs text-muted-foreground">Adicione transações para ver o gráfico.</p>
              </div>
            </div>
          )}
        </div>

        {/* Tip of the day */}
        <div className="space-y-4">
          <div className="bg-gradient-to-br from-primary/10 to-accent/10 rounded-2xl p-5 border border-primary/20">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center shrink-0 mt-0.5">
                <Lightbulb size={16} className="text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground mb-1">Dica do Dia 💡</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{activeTip.msg}</p>
              </div>
            </div>
          </div>

          {/* Recent transactions */}
          <div className="bg-card rounded-2xl p-5 border border-border">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-foreground text-sm">Últimas Transações</h3>
              <button onClick={() => onNavigate("transactions")} className="text-xs text-primary hover:underline">Ver todas</button>
            </div>
            {recent.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">Nenhuma transação registrada.</p>
            ) : (
              <div className="space-y-2">
                {recent.map(t => (
                  <div key={t.id} className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${t.type === "receita" ? "bg-green-100 text-green-600" : "bg-red-100 text-red-500"}`}>
                      {t.type === "receita" ? <ArrowUpCircle size={16} /> : (categoryIcons[t.category] || <ArrowDownCircle size={16} />)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-foreground truncate">{t.description || t.category}</div>
                      <div className="text-[10px] text-muted-foreground">{new Date(t.date).toLocaleDateString("pt-BR")}</div>
                    </div>
                    <span className={`text-xs font-semibold ${t.type === "receita" ? "text-green-600" : "text-red-500"}`}>
                      {t.type === "receita" ? "+" : "-"}{formatBRL(t.amount)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* FAB */}
      <button
        onClick={onNewTransaction}
        className="fixed bottom-24 md:bottom-8 right-6 w-14 h-14 bg-primary text-white rounded-2xl shadow-lg hover:bg-primary/90 active:scale-95 transition-all flex items-center justify-center z-40"
        aria-label="Nova Transação"
      >
        <Plus size={24} />
      </button>
    </div>
  );
}
