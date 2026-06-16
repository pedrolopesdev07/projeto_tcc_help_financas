import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { formatBRL } from "./ui/formatters";
import { Alert, AlertTitle, AlertDescription } from "./ui/alert";
import type { Transaction } from "./Transactions";

interface ReportsProps {
  transactions: Transaction[];
  userData: {
    strategy: string;
    strategyConfig?: {
      zero_categories?: Array<{ id: string; label: string; budget: number; color: string; emoji?: string }>;
    };
  };
}

const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

const categoryLabels: Record<string, string> = {
  alimentacao: "Alimentação",
  moradia: "Moradia",
  transporte: "Transporte",
  lazer: "Lazer",
  compras: "Compras",
  energia: "Energia/Água",
  celular: "Celular/Internet",
  saude: "Saúde",
  educacao: "Educação",
  salario: "Salário",
  freelance: "Freelance",
  investimento: "Investimento",
  outros: "Outros",
};

const categoryEmojis: Record<string, string> = {
  alimentacao: "🍽️",
  moradia: "🏠",
  transporte: "🚗",
  lazer: "🎉",
  compras: "🛍️",
  energia: "⚡",
  celular: "📱",
  saude: "💊",
  educacao: "📚",
  salario: "💰",
  freelance: "💻",
  investimento: "📈",
  outros: "📦",
};

const categoryColors: Record<string, string> = {
  alimentacao: "#1a7f5a",
  moradia: "#7c3aed",
  transporte: "#f59e0b",
  lazer: "#3b82f6",
  compras: "#ec4899",
  energia: "#14b8a6",
  celular: "#f97316",
  saude: "#84cc16",
  educacao: "#6366f1",
  salario: "#16a34a",
  freelance: "#0ea5e9",
  investimento: "#a855f7",
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

export function Reports({ transactions, userData }: ReportsProps) {
  const now = new Date();

  const getLast6MonthsData = () => {
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
      const m = d.getMonth();
      const y = d.getFullYear();
      const monthTxs = transactions.filter(t => {
        const td = new Date(t.date);
        return td.getMonth() === m && td.getFullYear() === y;
      });
      const receitas = monthTxs.filter(t => t.type === "receita").reduce((s, t) => s + t.amount, 0);
      const despesas = monthTxs.filter(t => t.type === "despesa").reduce((s, t) => s + t.amount, 0);
      return { month: `${months[m]}/${String(y).slice(2)}`, receitas, despesas, saldo: receitas - despesas };
    });
  };

  const chartData = getLast6MonthsData();

  const currentMonthData = chartData[chartData.length - 1];
  const prevMonthData = chartData[chartData.length - 2];

  const currentMonthDate = new Date();
  const currentMonthTransactions = transactions.filter(t => {
    const td = new Date(t.date);
    return td.getMonth() === currentMonthDate.getMonth() && td.getFullYear() === currentMonthDate.getFullYear();
  });

  const customZeroCategories = userData.strategy === "zero"
    ? userData.strategyConfig?.zero_categories ?? []
    : [];

  const normalizeCategoryColor = (color: string) => {
    if (color.startsWith("#")) return color;
    return zeroColorClassToHex[color] ?? "#94a3b8";
  };

  const customCategoryEmoji = Object.fromEntries(customZeroCategories.flatMap(cat => [
    [cat.id, cat.emoji ?? "📦"],
    [cat.label, cat.emoji ?? "📦"],
  ]));
  const customCategoryLabel = Object.fromEntries(customZeroCategories.flatMap(cat => [
    [cat.id, cat.label],
    [cat.label, cat.label],
  ]));
  const customCategoryColor = Object.fromEntries(customZeroCategories.flatMap(cat => [
    [cat.id, normalizeCategoryColor(cat.color)],
    [cat.label, normalizeCategoryColor(cat.color)],
  ]));

  const categorySpend = currentMonthTransactions
    .filter(t => t.type === "despesa")
    .reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);

  const pieData = Object.entries(categorySpend).map(([id, value]) => ({
    id,
    name: `${customCategoryEmoji[id] ?? categoryEmojis[id] ?? ""} ${customCategoryLabel[id] ?? categoryLabels[id] ?? id}`,
    value,
  }));

  const topCategory = Object.entries(categorySpend).sort((a, b) => b[1] - a[1])[0];
  const topCategoryLabel = topCategory ? customCategoryLabel[topCategory[0]] ?? categoryLabels[topCategory[0]] ?? topCategory[0] : null;
  const topCategoryEmoji = topCategory ? customCategoryEmoji[topCategory[0]] ?? categoryEmojis[topCategory[0]] : null;
  const alertMessage = topCategory
    ? `Sua maior despesa do mês está em ${topCategoryEmoji} ${topCategoryLabel}. Este relatório agora acompanha suas categorias personalizadas Base Zero.`
    : "Adicione despesas deste mês para começar a identificar padrões e prioridades no seu orçamento.";

  const incomeGrowth = prevMonthData.receitas > 0
    ? ((currentMonthData.receitas - prevMonthData.receitas) / prevMonthData.receitas) * 100
    : 0;
  const expenseGrowth = prevMonthData.despesas > 0
    ? ((currentMonthData.despesas - prevMonthData.despesas) / prevMonthData.despesas) * 100
    : 0;

  const totalIncome = chartData.reduce((s, d) => s + d.receitas, 0);
  const totalExpenses = chartData.reduce((s, d) => s + d.despesas, 0);
  const avgMonthBalance = (totalIncome - totalExpenses) / 6;

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <div>
            <h1 className="text-xl font-bold text-foreground">Relatórios & Insights</h1>
            <p className="text-sm text-muted-foreground">Acompanhe sua evolução financeira mês a mês e entenda onde estão suas principais receitas e despesas.</p>
          </div>
        </div>

        <Alert className="mb-5">
          <AlertTitle>Dica rápida</AlertTitle>
          <AlertDescription>
            <p>{alertMessage}</p>
            <p>Use esse relatório para criar metas mais inteligentes e proteger sua reserva de emergência.</p>
          </AlertDescription>
        </Alert>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Receitas acumuladas", value: totalIncome, color: "text-green-600", bg: "bg-green-50", icon: <TrendingUp size={16} className="text-green-600" /> },
          { label: "Despesas acumuladas", value: totalExpenses, color: "text-red-500", bg: "bg-red-50", icon: <TrendingDown size={16} className="text-red-500" /> },
          { label: "Saldo médio mensal", value: avgMonthBalance, color: avgMonthBalance >= 0 ? "text-green-600" : "text-red-500", bg: "bg-blue-50", icon: <Minus size={16} className="text-blue-500" /> },
          { label: "Variação de receita", value: null, color: incomeGrowth >= 0 ? "text-green-600" : "text-red-500", bg: "bg-purple-50", icon: <TrendingUp size={16} className="text-purple-500" />, label2: `${incomeGrowth >= 0 ? "+" : ""}${incomeGrowth.toFixed(1)}% vs mês anterior` },
        ].map((card, i) => (
          <div key={i} className="bg-card rounded-2xl border border-border p-4">
            <div className={`w-8 h-8 rounded-lg ${card.bg} flex items-center justify-center mb-2`}>
              {card.icon}
            </div>
            <div className={`font-bold text-base ${card.color}`}>
              {card.value !== null ? formatBRL(card.value) : card.label2}
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">{card.label}</div>
          </div>
        ))}
      </div>

      {/* Pie chart */}
      <div className="bg-card rounded-2xl border border-border p-5 mb-5">
        <h2 className="font-semibold text-foreground mb-4">Despesas por Categoria</h2>
        {pieData.length > 0 ? (
          <>
            <ResponsiveContainer width="100%" height={260}>
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
                  {pieData.map(entry => (
                    <Cell key={entry.id} fill={(customCategoryColor[entry.id] ?? categoryColors[entry.id]) || "#94a3b8"} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => formatBRL(value)} />
              </PieChart>
            </ResponsiveContainer>

            <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-2">
              {pieData.map(entry => (
                <div key={entry.id} className="flex items-center gap-3 rounded-2xl border border-border bg-muted/50 p-3 text-sm">
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl text-lg" style={{ backgroundColor: (customCategoryColor[entry.id] ?? categoryColors[entry.id]) || "#e2e8f0" }}>
                    {customCategoryEmoji[entry.id] ?? categoryEmojis[entry.id] ?? "•"}
                  </span>
                  <div className="min-w-0">
                    <p className="font-semibold text-foreground truncate">{customCategoryLabel[entry.id] ?? categoryLabels[entry.id] ?? entry.name}</p>
                    <p className="text-xs text-muted-foreground">{formatBRL(entry.value)}</p>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="h-[260px] flex items-center justify-center text-center">
            <div>
              <div className="text-3xl mb-2">📊</div>
              <p className="text-sm text-muted-foreground">Adicione despesas deste mês para visualizar o gráfico.</p>
            </div>
          </div>
        )}
      </div>

      {/* Bar chart */}
      <div className="bg-card rounded-2xl border border-border p-5 mb-5">
        <h2 className="font-semibold text-foreground mb-4">Receitas × Despesas por Mês</h2>
        {transactions.length === 0 ? (
          <div className="h-[220px] flex items-center justify-center text-center">
            <div>
              <div className="text-3xl mb-2">📊</div>
              <p className="text-sm text-muted-foreground">Adicione transações para visualizar o gráfico.</p>
            </div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
              <YAxis tickFormatter={v => `R$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
              <Tooltip formatter={(value: number) => formatBRL(value)} />
              <Legend />
              <Bar dataKey="receitas" name="Receitas" fill="#1a7f5a" radius={[4, 4, 0, 0]} />
              <Bar dataKey="despesas" name="Despesas" fill="#dc2626" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Line chart */}
      <div className="bg-card rounded-2xl border border-border p-5">
        <h2 className="font-semibold text-foreground mb-4">Evolução do Saldo</h2>
        {transactions.length === 0 ? (
          <div className="h-[200px] flex items-center justify-center text-center">
            <div>
              <div className="text-3xl mb-2">📈</div>
              <p className="text-sm text-muted-foreground">Adicione transações para visualizar a evolução.</p>
            </div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
              <YAxis tickFormatter={v => `R$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
              <Tooltip formatter={(value: number) => formatBRL(value)} />
              <Line type="monotone" dataKey="saldo" name="Saldo" stroke="#7c3aed" strokeWidth={2.5} dot={{ fill: "#7c3aed", r: 4 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
