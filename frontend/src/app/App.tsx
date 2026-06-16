/* MARKER-MAKE-KIT-INVOKED */
import { useEffect, useState } from "react";
import "../styles/fonts.css";
import { AuthScreen } from "./components/AuthScreen";
import { OnboardingScreen, type OnboardingData } from "./components/OnboardingScreen";
import { AppLayout } from "./components/AppLayout";
import { Dashboard } from "./components/Dashboard";
import { Transactions, type Transaction } from "./components/Transactions";
import { Goals, type Goal } from "./components/Goals";
import { Reports } from "./components/Reports";
import { Education } from "./components/Education";
import { SettingsScreen } from "./components/SettingsScreen";
import * as api from "./api";

type AppState = "auth" | "onboarding" | "app";

const defaultUserData: OnboardingData = {
  name: "",
  income: "",
  goal: "reserve",
  profile: "balanced",
  strategy: "50-30-20",
  email: "",
};

const CATEGORY_NAME_TO_ALIAS: Record<string, string> = {
  "Alimentação": "alimentacao",
  "Moradia": "moradia",
  "Transporte": "transporte",
  "Lazer": "lazer",
  "Compras": "compras",
  "Energia/Água": "energia",
  "Celular/Internet": "celular",
  "Salário": "salario",
  "Freelance": "freelance",
  "Investimento": "investimento",
  "Outros": "outros",
};

const mapTransaction = (item: any): Transaction => ({
  id: item.id,
  type: item.tipo,
  amount: Number(item.valor),
  category: CATEGORY_NAME_TO_ALIAS[item.categoria?.nome] ?? item.categoria?.nome ?? "outros",
  description: item.descricao ?? "",
  date: new Date(item.data).toISOString().split("T")[0],
  recurrence: item.recorrencia === "nenhuma" ? "unica" : item.recorrencia as Transaction["recurrence"]
});

const mapGoal = (item: any): Goal => ({
  id: item.id,
  name: item.nome,
  emoji: item.nome.toLowerCase().includes("reserva") ? "🛡️" : "🎯",
  target: Number(item.valor_total),
  current: Number(item.valor_atual),
  deadline: new Date(item.data_limite).toISOString().split("T")[0],
  color: item.nome.toLowerCase().includes("reserva") ? "bg-primary" : "bg-accent"
});

const goalLabelMap: Record<string, string> = {
  reserve: "Reserva de Emergência",
  debts: "Quitar Dívidas",
  invest: "Investimento",
  goals: "Objetivo Pessoal",
};

const profileLabelMap: Record<string, string> = {
  overspend: "Gasto mais do que ganho",
  balanced: "Sou equilibrado",
  saver: "Poupo regularmente",
};

const incomeRangeLabelMap: Record<string, number> = {
  "Até R$ 1.500": 1500,
  "R$ 1.500 a R$ 3.000": 2250,
  "R$ 3.000 a R$ 6.000": 4500,
  "R$ 6.000 a R$ 12.000": 9000,
  "Acima de R$ 12.000": 15000,
};

const incomeRanges = Object.keys(incomeRangeLabelMap);

const incomeValueToRange = (value: number | null | undefined): string => {
  if (!value || Number.isNaN(value)) return "";
  if (value <= 1500) return "Até R$ 1.500";
  if (value <= 3000) return "R$ 1.500 a R$ 3.000";
  if (value <= 6000) return "R$ 3.000 a R$ 6.000";
  if (value <= 12000) return "R$ 6.000 a R$ 12.000";
  return "Acima de R$ 12.000";
};

const incomeRangeToValue = (label: string): number | undefined => {
  return incomeRangeLabelMap[label];
};

const incomeValueToDisplay = (value: number | null | undefined): string => {
  if (!value || Number.isNaN(value)) return "";
  const normalized = Number(value);
  const exactRangeLabel = Object.entries(incomeRangeLabelMap).find(([, amount]) => amount === normalized)?.[0];
  if (exactRangeLabel) return exactRangeLabel;
  return `R$ ${normalized.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const parseIncomeInput = (value: string): number | undefined => {
  const normalized = value
    .trim()
    .replace(/\s/g, "")
    .replace(/R\$/gi, "")
    .replace(/\./g, "")
    .replace(/,/g, ".");
  const numberValue = Number(normalized);
  return Number.isFinite(numberValue) ? numberValue : undefined;
};

export default function App() {
  const [appState, setAppState] = useState<AppState>("auth");
  const [activePage, setActivePage] = useState("dashboard");
  const [userData, setUserData] = useState<OnboardingData>(defaultUserData);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [openNewTransaction, setOpenNewTransaction] = useState(false);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState<"light" | "dark">("light");

  const loadTransactions = async () => {
    const response = await api.fetchTransactions();
    if (Array.isArray(response)) {
      setTransactions(response.map(mapTransaction));
    }
  };

  const loadGoals = async () => {
    const response = await api.fetchGoals();
    if (Array.isArray(response)) {
      setGoals(response.map(mapGoal));
    }
  };

  const loadSession = async () => {
    setLoading(true);
    try {
      const me: any = await api.getMe();
      const reverseGoalLabelMap: Record<string, string> = {
        "Quitar Dívidas": "debts",
        "Reserva de Emergência": "reserve",
        "Investimento": "invest",
        "Objetivo Pessoal": "goals",
      };

      const reverseProfileLabelMap: Record<string, string> = {
        "Gasto mais do que ganho": "overspend",
        "Sou equilibrado": "balanced",
        "Poupo regularmente": "saver",
      };

      setUserData({
        name: me.nome || "",
        email: me.email || "",
        income: incomeValueToDisplay(Number(me.renda_mensal)),
        goal: reverseGoalLabelMap[me.perfis_financeiros?.objetivo_principal ?? ""] ?? "reserve",
        profile: reverseProfileLabelMap[me.perfis_financeiros?.perfil_consumidor ?? ""] ?? "balanced",
        strategy: me.perfis_financeiros?.config_estrategia?.strategy || me.estrategia_financeira || "50-30-20",
        strategyConfig: me.perfis_financeiros?.config_estrategia ?? undefined,
      });
      setAppState(me.onboarding_concluido ? "app" : "onboarding");
      await Promise.all([loadTransactions(), loadGoals()]);
    } catch (error) {
      api.clearTokens();
      setAppState("auth");
      setTransactions([]);
      setGoals([]);
      setUserData(defaultUserData);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const storedTheme = localStorage.getItem("helpfinance_theme");
    setTheme(storedTheme === "dark" ? "dark" : "light");

    const accessToken = localStorage.getItem("helpfinance_accessToken");
    if (accessToken) {
      void loadSession();
    } else {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem("helpfinance_theme", theme);
  }, [theme]);

  const handleToggleTheme = () => {
    setTheme(prev => (prev === "dark" ? "light" : "dark"));
  };

  const handleAuthSubmit = async (mode: "login" | "signup", data: { name: string; email: string; password: string }) => {
    try {
      if (mode === "signup") {
        await api.register(data.name, data.email, data.password);
      }

      const result: any = await api.login(data.email, data.password);
      api.saveTokens(result.accessToken, result.refreshToken);
      await loadSession();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro de autenticação.";
      throw new Error(message);
    }
  };

  const handleLogout = async () => {
    const refreshToken = api.getRefreshToken();
    try {
      if (refreshToken) await api.logout(refreshToken);
    } catch (error) {
      // ignore logout errors and clear session anyway
    }
    api.clearTokens();
    setAppState("auth");
    setActivePage("dashboard");
    setUserData(defaultUserData);
    setTransactions([]);
    setGoals([]);
  };

  const handleNewTransaction = () => {
    setActivePage("transactions");
    setOpenNewTransaction(true);
    setTimeout(() => setOpenNewTransaction(false), 100);
  };

  const handleOnboardingComplete = async (data: OnboardingData) => {
    const payload = {
      objetivo_principal: goalLabelMap[data.goal] ?? data.goal,
      perfil_consumidor: profileLabelMap[data.profile] ?? data.profile,
      dependentes: 0,
      config_estrategia: { strategy: data.strategy }
    };

    await api.onboarding(payload);
    setUserData(data);
    setAppState("app");
    await Promise.all([loadTransactions(), loadGoals()]);
  };

  const handleAddTransaction = async (transaction: Transaction) => {
    try {
      const categoryKey = userData.strategy === "zero" && userData.strategyConfig?.zero_categories
        ? userData.strategyConfig.zero_categories.find(cat => cat.id === transaction.category || cat.label === transaction.category)?.label ?? transaction.category
        : transaction.category;

      const response: any = await api.createTransaction({
        tipo: transaction.type,
        valor: transaction.amount,
        descricao: transaction.description,
        data: transaction.date,
        categoria_key: categoryKey,
        recorrencia: transaction.recurrence,
      });
      const created = mapTransaction(response.transacao ?? response);
      setTransactions(prev => [created, ...prev]);
    } catch (error) {
      console.error(error);
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    try {
      await api.deleteTransaction(id);
      setTransactions(prev => prev.filter(t => t.id !== id));
    } catch (error) {
      console.error(error);
    }
  };

  const handleAddGoal = async (goal: Goal) => {
    try {
      const response = await api.createGoal({
        nome: goal.name,
        tipo_meta: "objetivo_compra",
        valor_total: goal.target,
        valor_atual: goal.current,
        data_limite: goal.deadline,
      });
      setGoals(prev => [mapGoal(response), ...prev]);
    } catch (error) {
      console.error(error);
    }
  };

  const handleUpdateGoal = async (id: string, amount: number) => {
    const existing = goals.find(goal => goal.id === id);
    if (!existing) return;

    try {
      const response = await api.updateGoal(id, { valor_atual: existing.current + amount });
      setGoals(prev => prev.map(goal => (goal.id === id ? mapGoal(response) : goal)));
    } catch (error) {
      console.error(error);
    }
  };

  const handleDeleteGoal = async (id: string) => {
    try {
      await api.deleteGoal(id);
      setGoals(prev => prev.filter(goal => goal.id !== id));
    } catch (error) {
      console.error(error);
    }
  };

  const handleUpdateUser = async (data: Partial<OnboardingData>) => {
    try {
      const payload: any = {};
      if (data.name) payload.nome = data.name;
      if (data.email) payload.email = data.email;
      if (data.password) payload.senha = data.password;
      if (data.strategy) payload.estrategia_financeira = data.strategy;
      if (data.strategyConfig !== undefined) payload.config_estrategia = data.strategyConfig;
      if (data.income) {
        const incomeValue = incomeRangeToValue(data.income) ?? parseIncomeInput(data.income);
        if (incomeValue !== undefined) {
          payload.renda_mensal = incomeValue;
        }
      }
      let updatedUser: any = null;
      if (Object.keys(payload).length > 0) {
        updatedUser = await api.updateMe(payload);
      }

      const safeData = { ...data };
      delete (safeData as any).password;

      setUserData(prev => ({
        ...prev,
        ...safeData,
        name: updatedUser?.nome ?? data.name ?? prev.name,
        email: updatedUser?.email ?? data.email ?? prev.email,
        income: updatedUser?.renda_mensal !== undefined
          ? (data.income && incomeRanges.includes(data.income)
            ? data.income
            : incomeValueToDisplay(Number(updatedUser.renda_mensal)))
          : data.income ?? prev.income,
        strategy: updatedUser?.estrategia_financeira ?? data.strategy ?? prev.strategy,
        strategyConfig: updatedUser?.perfis_financeiros?.config_estrategia ?? data.strategyConfig ?? prev.strategyConfig,
      }));
    } catch (error) {
      console.error(error);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      await api.deleteMe();
    } catch (error) {
      console.error(error);
    }
    handleLogout();
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Carregando...</div>;
  }

  if (appState === "auth") {
    return <AuthScreen onSubmit={handleAuthSubmit} />;
  }

  if (appState === "onboarding") {
    return <OnboardingScreen onComplete={handleOnboardingComplete} />;
  }

  const renderPage = () => {
    switch (activePage) {
      case "dashboard":
        return <Dashboard primaryGoal={userData.goal} userData={userData} transactions={transactions} onNewTransaction={handleNewTransaction} onNavigate={setActivePage} theme={theme} onToggleTheme={handleToggleTheme} onUpdateStrategyConfig={(config) => setUserData(prev => ({ ...prev, strategyConfig: config }))} />;
      case "transactions":
        return <Transactions transactions={transactions} userData={userData} onAdd={handleAddTransaction} onDelete={handleDeleteTransaction} initialOpenForm={openNewTransaction} />;
      case "goals":
        return <Goals primaryGoal={userData.goal} goals={goals} onAddGoal={handleAddGoal} onUpdateGoal={handleUpdateGoal} onDeleteGoal={handleDeleteGoal} transactions={transactions} />;
      case "reports":
        return <Reports transactions={transactions} userData={userData} />;
      case "education":
        return <Education transactions={transactions} />;
      case "settings":
        return <SettingsScreen userData={userData} onUpdateUser={handleUpdateUser} onLogout={handleLogout} onDeleteAccount={handleDeleteAccount} theme={theme} onToggleTheme={handleToggleTheme} />;
      default:
        return null;
    }
  };

  return (
    <AppLayout activePage={activePage} onNavigate={setActivePage} userData={userData} onLogout={handleLogout}>
      {renderPage()}
    </AppLayout>
  );
}
