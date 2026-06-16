import { FormEvent, useState } from "react";
import { Plus, Target, X, Calendar, Wallet, Check, ChevronRight, Star, Shield } from "lucide-react";
import { formatBRL } from "./ui/formatters";
import type { Transaction } from "./Transactions";

export interface Goal {
  id: string;
  name: string;
  emoji: string;
  target: number;
  current: number;
  deadline: string;
  color: string;
}

interface GoalsProps {
  primaryGoal?: string;
  goals: Goal[];
  onAddGoal: (g: Goal) => void;
  onUpdateGoal: (id: string, amount: number) => void;
  onDeleteGoal: (id: string) => void;
  transactions: Transaction[];
}

const goalTemplates = [
  { emoji: "🛡️", name: "Reserva de Emergência", color: "bg-primary" },
  { emoji: "✈️", name: "Viagem dos Sonhos", color: "bg-accent" },
  { emoji: "🏠", name: "Casa Própria", color: "bg-blue-500" },
  { emoji: "🚗", name: "Carro Novo", color: "bg-orange-500" },
  { emoji: "🎓", name: "Educação", color: "bg-indigo-500" },
  { emoji: "💰", name: "Investimentos", color: "bg-yellow-500" },
];

const colors = [
  { label: "Verde", value: "bg-primary" },
  { label: "Roxo", value: "bg-accent" },
  { label: "Azul", value: "bg-blue-500" },
  { label: "Laranja", value: "bg-orange-500" },
  { label: "Rosa", value: "bg-pink-500" },
];

const primaryGoalInfo: Record<string, { label: string; emoji: string; description: string; color: string }> = {
  reserve: { label: "Reserva de Emergência", emoji: "🛡️", description: "Fortaleça sua proteção financeira priorizando esta meta antes de outros desejos.", color: "bg-primary" },
  debts: { label: "Quitar Dívidas", emoji: "💳", description: "Reduza juros pagos ao priorizar o pagamento de dívidas mais caras.", color: "bg-red-500" },
  invest: { label: "Investimento", emoji: "📈", description: "Comece pequeno e aumente a consistência para ver seus ganhos crescerem.", color: "bg-yellow-500" },
  goals: { label: "Realizar Sonhos", emoji: "🎯", description: "Transforme projetos grandes em passos menores e mantenha o foco até a conclusão.", color: "bg-accent" },
};

const MAX_GOAL_VALUE = 99999999.99;

const defaultForm = () => ({
  name: "",
  emoji: "🎯",
  target: "",
  current: "",
  deadline: "",
  color: "bg-primary",
});


const parseValue = (value: string) => {
  const normalized = value.replace(/,/g, ".").trim();
  return Number(normalized || 0);
};

export function Goals({ primaryGoal, goals, onAddGoal, onUpdateGoal, onDeleteGoal, transactions }: GoalsProps) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(defaultForm());
  const [depositGoal, setDepositGoal] = useState<string | null>(null);
  const [depositAmount, setDepositAmount] = useState("");
  const [formErrors, setFormErrors] = useState<{ target?: string; deadline?: string; name?: string }>({});

  const totalExpenses = transactions
    .filter(t => t.type === "despesa")
    .reduce((s, t) => s + t.amount, 0);
  const emergencyTarget = totalExpenses * 6 || 18000;
  const selectedPrimaryGoal = primaryGoal ? primaryGoalInfo[primaryGoal] : undefined;
  const primaryGoalExists = selectedPrimaryGoal
    ? goals.some(goal => goal.name.toLowerCase().includes(selectedPrimaryGoal.label.toLowerCase()))
    : false;

  const hasEmergency = goals.some(g => g.name.toLowerCase().includes("reserva") || g.name.toLowerCase().includes("emergência"));

  const totalSaved = goals.reduce((sum, goal) => sum + goal.current, 0);
  const totalTarget = goals.reduce((sum, goal) => sum + goal.target, 0);
  const completedGoals = goals.filter(goal => goal.current >= goal.target).length;
  const overallProgress = totalTarget ? Math.min((totalSaved / totalTarget) * 100, 100) : 0;

  const validateForm = () => {
    const errors: typeof formErrors = {};
    if (!form.name.trim()) {
      errors.name = "Dê um nome para sua meta.";
    }

    const targetValue = parseValue(form.target);
    if (!form.target || Number.isNaN(targetValue) || targetValue <= 0) {
      errors.target = "Informe um valor alvo válido.";
    } else if (targetValue > MAX_GOAL_VALUE) {
      errors.target = "Valor muito alto. Use até R$ 99.999.999,99.";
    }

    if (!form.deadline) {
      errors.deadline = "Defina uma data de prazo.";
    } else {
      const deadlineDate = new Date(form.deadline);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (deadlineDate < today) {
        errors.deadline = "⚠️ Opa! Essa data já passou. Tente selecionar uma data futura.";
      }
    }

    setFormErrors(errors);
    return errors;
  };

  const handleAdd = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const errors = validateForm();
    if (Object.keys(errors).length > 0) return;

    onAddGoal({
      id: crypto.randomUUID(),
      name: form.name,
      emoji: form.emoji,
      target: parseValue(form.target),
      current: parseValue(form.current || "0"),
      deadline: form.deadline,
      color: form.color,
    });
    setForm(defaultForm());
    setFormErrors({});
    setShowForm(false);
  };

  const handleDeposit = (goalId: string) => {
    const amount = parseFloat(depositAmount);
    if (amount > 0) {
      onUpdateGoal(goalId, amount);
      setDepositGoal(null);
      setDepositAmount("");
    }
  };

  const getDaysLeft = (deadline: string) => {
    if (!deadline) return null;
    const diff = new Date(deadline).getTime() - Date.now();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-foreground">Metas Financeiras</h1>
          <p className="text-sm text-muted-foreground">Planeje objetivos com passos claros, acompanhe progresso e mantenha prioridades alinhadas ao seu bolso.</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl font-medium text-sm hover:bg-primary/90 transition-all min-h-[44px]"
        >
          <Plus size={16} />
          <span className="hidden sm:inline">Nova meta</span>
        </button>
      </div>

      {selectedPrimaryGoal && (
        <div className={`bg-card rounded-3xl border border-border p-5 mb-6`}> 
          <div className="flex items-start gap-4">
            <div className={`w-14 h-14 rounded-3xl ${selectedPrimaryGoal.color} flex items-center justify-center text-2xl`}>{selectedPrimaryGoal.emoji}</div>
            <div className="flex-1">
              <p className="text-xs uppercase tracking-[0.28em] text-primary font-semibold">Meta principal selecionada</p>
              <h2 className="mt-3 text-lg font-semibold text-foreground">{selectedPrimaryGoal.label}</h2>
              <p className="text-sm text-muted-foreground mt-2">{selectedPrimaryGoal.description}</p>
              <p className="text-sm text-muted-foreground mt-3">
                {primaryGoalExists
                  ? "Sua meta principal aparece entre os objetivos cadastrados. Continue acompanhando e faça aportes para chegar lá mais rápido."
                  : `Crie uma meta com foco em ${selectedPrimaryGoal.label.toLowerCase()} para manter essa prioridade clara no seu planejamento financeiro.`}
              </p>
            </div>
            {!primaryGoalExists && (
              <button
                onClick={() => {
                  setForm({
                    name: selectedPrimaryGoal.label,
                    emoji: selectedPrimaryGoal.emoji,
                    target: "",
                    current: "",
                    deadline: "",
                    color: selectedPrimaryGoal.color,
                  });
                  setShowForm(true);
                }}
                className="rounded-2xl bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary/90 transition-all"
              >
                Criar meta principal
              </button>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-card rounded-3xl border border-border p-5 shadow-sm">
          <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground font-semibold">Metas totais</p>
          <p className="mt-3 text-3xl font-semibold text-foreground">{goals.length}</p>
          <p className="text-sm text-muted-foreground mt-2">Objetivos cadastrados para sua jornada financeira.</p>
        </div>
        <div className="bg-card rounded-3xl border border-border p-5 shadow-sm">
          <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground font-semibold">Economia atual</p>
          <p className="mt-3 text-3xl font-semibold text-foreground">{formatBRL(totalSaved)}</p>
          <p className="text-sm text-muted-foreground mt-2">Quanto você já reservou para seus objetivos.</p>
        </div>
        <div className="bg-card rounded-3xl border border-border p-5 shadow-sm">
          <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground font-semibold">Progresso geral</p>
          <div className="flex items-center justify-between gap-3 mt-3">
            <p className="text-3xl font-semibold text-foreground">{Math.round(overallProgress)}%</p>
            <span className="text-xs text-muted-foreground">{completedGoals} concluídas</span>
          </div>
          <div className="mt-3 h-2 rounded-full bg-muted overflow-hidden">
            <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${overallProgress}%` }} />
          </div>
        </div>
      </div>

      {/* Emergency fund suggestion */}
      {!hasEmergency && (
        <div className="bg-gradient-to-r from-primary/10 to-blue-500/10 rounded-2xl border border-primary/20 p-5 mb-5">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
              <Shield size={20} className="text-primary" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <p className="font-semibold text-foreground text-sm">Reserva de Emergência</p>
                <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">Sugerido</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed mb-3">
                Especialistas recomendam guardar 6 meses de despesas. Seu alvo seria de {formatBRL(emergencyTarget)}.
              </p>
              <button
                onClick={() => {
                  setForm({ name: "Reserva de Emergência", emoji: "🛡️", target: String(emergencyTarget), current: "", deadline: "", color: "bg-primary" });
                  setShowForm(true);
                }}
                className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
              >
                Criar agora <ChevronRight size={12} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Goals grid */}
      <div className="grid grid-cols-1 gap-4 mb-8">
        {goals.length === 0 ? (
          <div className="bg-card rounded-3xl border border-border p-6 md:p-8 shadow-[0_20px_80px_rgba(15,23,42,0.04)]">
            <div className="space-y-6">
              <div className="max-w-2xl">
                <p className="text-sm uppercase tracking-[0.3em] text-primary/90 font-semibold">Metas e Estratégias</p>
                <h2 className="text-3xl font-bold text-foreground mt-3">Ainda não há metas criadas</h2>
                <p className="text-sm text-muted-foreground mt-3">Defina seu primeiro objetivo financeiro e comece a transformar seus planos em resultados reais.</p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-[1.75rem] border border-border bg-muted/50 p-5">
                  <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Meta recomendada</p>
                  <h3 className="mt-3 text-lg font-semibold text-foreground">Reserva de Emergência</h3>
                  <p className="mt-2 text-sm text-muted-foreground">A base de uma estratégia segura é ter 6 meses de despesas guardadas.</p>
                </div>
                <div className="rounded-[1.75rem] border border-border bg-muted/50 p-5">
                  <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Inspire-se</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="rounded-full bg-background px-3 py-2 text-xs font-semibold text-foreground">Carro de Luxo</span>
                    <span className="rounded-full bg-background px-3 py-2 text-xs font-semibold text-foreground">Casa de Luxo</span>
                    <span className="rounded-full bg-background px-3 py-2 text-xs font-semibold text-foreground">Viagem em Dubai</span>
                    <span className="rounded-full bg-background px-3 py-2 text-xs font-semibold text-foreground">Reserva Financeira</span>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-border bg-background p-6 text-center">
                <p className="text-sm font-semibold text-foreground">Sem metas ainda?</p>
                <p className="text-xs text-muted-foreground mt-2">Clique em “Nova Meta” e transforme um objetivo em um plano financeiro.</p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-foreground">Pronto para começar?</p>
                  <p className="text-xs text-muted-foreground mt-1">Defina seu primeiro objetivo financeiro agora mesmo.</p>
                </div>
                <button
                  onClick={() => setShowForm(true)}
                  className="inline-flex items-center justify-center rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-primary/15 hover:bg-primary/90 transition-all"
                >
                  Nova Meta
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {goals.map(goal => {
              const pct = Math.min((goal.current / goal.target) * 100, 100);
              const daysLeft = getDaysLeft(goal.deadline);
              const completed = pct >= 100;
              return (
                <div key={goal.id} className={`bg-card rounded-2xl border p-5 transition-all ${completed ? "border-green-200" : "border-border"}`}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{goal.emoji}</span>
                      <div>
                        <p className="font-semibold text-foreground text-sm">{goal.name}</p>
                        {daysLeft !== null && (
                          <p className={`text-xs ${daysLeft < 30 ? "text-orange-500" : "text-muted-foreground"}`}>
                            {daysLeft > 0 ? `${daysLeft} dias restantes` : "Prazo encerrado"}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] rounded-full px-2 py-1 font-semibold ${completed ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"}`}>
                        {completed ? "Completa" : "Em andamento"}
                      </span>
                      <button onClick={() => onDeleteGoal(goal.id)} className="w-8 h-8 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-50 flex items-center justify-center transition-all">
                        <X size={14} />
                      </button>
                    </div>
                  </div>

                  <div className="mb-3">
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-muted-foreground">Progresso</span>
                      <span className="font-semibold text-foreground">{Math.round(pct)}%</span>
                    </div>
                    <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-700 ${completed ? "bg-green-500" : goal.color || "bg-primary"}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>

                  <div className="flex items-center justify-between mb-3">
                    <div className="text-xs text-muted-foreground">
                      <span className="font-bold text-foreground text-sm">{formatBRL(goal.current)}</span> / {formatBRL(goal.target)}
                    </div>
                    <span className="text-xs text-muted-foreground">Falta {formatBRL(Math.max(0, goal.target - goal.current))}</span>
                  </div>

                  {!completed && (
                    depositGoal === goal.id ? (
                      <div className="flex gap-2">
                        <input
                          type="number"
                          placeholder="R$ valor"
                          value={depositAmount}
                          onChange={e => setDepositAmount(e.target.value)}
                          className="flex-1 px-3 py-2 rounded-xl bg-input-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                        />
                        <button onClick={() => handleDeposit(goal.id)} className="px-3 py-2 bg-primary text-white rounded-xl text-xs font-medium hover:bg-primary/90 transition-all min-w-[44px] min-h-[44px] flex items-center justify-center">
                          <Check size={14} />
                        </button>
                        <button onClick={() => setDepositGoal(null)} className="px-3 py-2 bg-muted text-muted-foreground rounded-xl text-xs hover:bg-muted/80 transition-all min-h-[44px] flex items-center justify-center">
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <button onClick={() => setDepositGoal(goal.id)} className="w-full py-2.5 rounded-xl border border-primary/30 text-primary text-xs font-medium hover:bg-primary/5 transition-all min-h-[44px]">
                        + Depositar
                      </button>
                    )
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Goal Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end md:items-center justify-center p-4">
          <div className="bg-card rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl animate-in slide-in-from-bottom-4 duration-300">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h2 className="font-bold text-foreground">Nova Meta</h2>
              <button onClick={() => setShowForm(false)} className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleAdd} className="p-5 space-y-4">
              {/* Templates */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Modelos rápidos</label>
                <div className="grid grid-cols-2 gap-2">
                  {goalTemplates.map(t => (
                    <button
                      key={t.name}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, name: t.name, emoji: t.emoji, color: t.color }))}
                      className={`p-2.5 rounded-xl border text-left text-xs font-medium transition-all min-h-[44px] ${form.name === t.name ? "border-primary bg-primary/5 text-primary" : "border-border bg-muted/30 text-foreground hover:border-primary/30"}`}
                    >
                      {t.emoji} {t.name}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Nome da meta</label>
                <input
                  type="text"
                  placeholder="Ex: Viagem para Europa"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl bg-input-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    <Wallet size={14} className="inline mr-1" />Valor alvo (R$)
                  </label>
                  <input
                    type="number"
                    placeholder="0,00"
                    value={form.target}
                    onChange={e => setForm(f => ({ ...f, target: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl bg-input-background border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Já economizei (R$)</label>
                  <input
                    type="number"
                    placeholder="0,00"
                    value={form.current}
                    onChange={e => setForm(f => ({ ...f, current: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl bg-input-background border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  <Calendar size={14} className="inline mr-1" />Prazo
                </label>
                <input
                  type="date"
                  value={form.deadline}
                  onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl bg-input-background border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Cor</label>
                <div className="flex gap-2">
                  {colors.map(c => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, color: c.value }))}
                      className={`w-8 h-8 rounded-full ${c.value} transition-all ${form.color === c.value ? "ring-2 ring-offset-2 ring-foreground scale-110" : ""}`}
                      title={c.label}
                    />
                  ))}
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-primary text-white rounded-xl font-semibold text-sm hover:bg-primary/90 active:scale-[0.98] transition-all min-h-[44px]"
              >
                Criar Meta
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
