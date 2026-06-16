import { useState } from "react";
import { TrendingUp, ChevronRight, ChevronLeft, Banknote, Target, Lightbulb, BarChart2, Check } from "lucide-react";

interface OnboardingScreenProps {
  onComplete: (data: OnboardingData) => void;
}

export interface OnboardingData {
  name: string;
  income: string;
  goal: string;
  profile: string;
  strategy: string;
  email?: string;
  password?: string;
  photoUrl?: string;
  strategyConfig?: {
    strategy?: string;
    zero_categories?: Array<{ id: string; label: string; budget: number; color: string }>;
  };
}

const incomeRanges = [
  "Até R$ 1.500",
  "R$ 1.500 a R$ 3.000",
  "R$ 3.000 a R$ 6.000",
  "R$ 6.000 a R$ 12.000",
  "Acima de R$ 12.000",
];

const goals = [
  { id: "debts", icon: "💳", label: "Sair das Dívidas", description: "Quitar e eliminar dívidas existentes" },
  { id: "reserve", icon: "🏦", label: "Criar Reserva", description: "Guardar dinheiro para emergências" },
  { id: "invest", icon: "📈", label: "Investir", description: "Fazer o dinheiro trabalhar por você" },
  { id: "goals", icon: "🎯", label: "Realizar Sonhos", description: "Viagem, casa, carro e outros projetos" },
];

const profiles = [
  { id: "overspend", icon: "😅", label: "Gasto mais do que ganho", color: "border-red-200 bg-red-50" },
  { id: "balanced", icon: "⚖️", label: "Sou equilibrado", color: "border-yellow-200 bg-yellow-50" },
  { id: "saver", icon: "💪", label: "Poupo regularmente", color: "border-green-200 bg-green-50" },
];

const strategies = [
  { id: "50-30-20", icon: "📊", label: "Regra 50-30-20", description: "50% Essenciais, 30% Desejos, 20% Prioridades. Simples e eficaz!", highlight: true },
  { id: "zero", icon: "🎯", label: "Orçamento Base Zero", description: "Cada centavo tem um destino. Controle total do seu dinheiro." },
  { id: "80-20", icon: "⚡", label: "Regra 80/20", description: "Poupe 20% assim que receber. Livre para gastar os 80% restantes." },
];

export function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  const [step, setStep] = useState(1);
  const [data, setData] = useState<OnboardingData>({ name: "", income: "", goal: "", profile: "", strategy: "" });
  const [showCustomIncomeInput, setShowCustomIncomeInput] = useState(false);
  const [customIncome, setCustomIncome] = useState("");
  const [incomeError, setIncomeError] = useState("");

  const isValidIncomeInput = (value: string) => {
    const normalized = value
      .trim()
      .replace(/\s/g, "")
      .replace(/R\$/gi, "")
      .replace(/\./g, "")
      .replace(/,/g, ".");
    const numberValue = Number(normalized);
    return Number.isFinite(numberValue) && numberValue >= 0;
  };

  const totalSteps = 4;
  const progress = (step / totalSteps) * 100;

  const next = () => {
    if (step < totalSteps) setStep(s => s + 1);
    else onComplete(data);
  };

  const canNext = () => {
    const isCustomIncome = data.income && !incomeRanges.includes(data.income);
    if (step === 1) return data.name.trim() && data.income && (!showCustomIncomeInput || isValidIncomeInput(data.income) || isCustomIncome);
    if (step === 2) return !!data.goal;
    if (step === 3) return !!data.profile;
    if (step === 4) return !!data.strategy;
    return false;
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-border px-6 py-4 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
          <TrendingUp size={16} className="text-white" />
        </div>
        <span className="font-bold text-foreground">Help Finanças</span>
        <span className="ml-auto text-sm text-muted-foreground">Passo {step} de {totalSteps}</span>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-muted">
        <div className="h-full bg-primary transition-all duration-500 rounded-r-full" style={{ width: `${progress}%` }} />
      </div>

      <div className="flex-1 flex flex-col max-w-lg mx-auto w-full px-6 py-8">
        {/* Step indicators */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {Array.from({ length: totalSteps }, (_, i) => (
            <div key={i} className={`transition-all duration-300 rounded-full ${i + 1 < step ? "w-6 h-6 bg-primary flex items-center justify-center" : i + 1 === step ? "w-6 h-2 bg-primary" : "w-2 h-2 bg-muted"}`}>
              {i + 1 < step && <Check size={12} className="text-white" />}
            </div>
          ))}
        </div>

        {/* Step 1: Name and Income */}
        {step === 1 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
              <Banknote size={24} className="text-primary" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Olá! Vamos começar</h2>
            <p className="text-muted-foreground mb-6 text-sm">Precisamos saber um pouco sobre você para personalizar sua experiência.</p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Como você quer ser chamado?</label>
                <input
                  type="text"
                  placeholder="Seu primeiro nome"
                  value={data.name}
                  onChange={e => setData({ ...data, name: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-input-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Qual é sua renda mensal líquida?</label>
                <div className="grid grid-cols-1 gap-2">
                  {incomeRanges.map(range => (
                    <button
                      key={range}
                      onClick={() => {
                        setData({ ...data, income: range });
                        setShowCustomIncomeInput(false);
                        setCustomIncome("");
                        setIncomeError("");
                      }}
                      className={`py-3 px-4 rounded-xl border text-sm font-medium text-left transition-all min-h-[44px] ${data.income === range && !showCustomIncomeInput ? "border-primary bg-primary/5 text-primary" : "border-border bg-card text-foreground hover:border-primary/40"}`}
                    >
                      {range}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      const nextState = !showCustomIncomeInput;
                      setShowCustomIncomeInput(nextState);
                      setData({ ...data, income: nextState ? customIncome || data.income || "" : "" });
                      if (!nextState) {
                        setCustomIncome("");
                      }
                      setIncomeError("");
                    }}
                    className={`py-3 px-4 rounded-xl border text-sm font-medium text-left transition-all min-h-[44px] ${showCustomIncomeInput ? "border-primary bg-primary/5 text-primary" : "border-border bg-card text-foreground hover:border-primary/40"}`}
                  >
                    {showCustomIncomeInput ? "Usar faixa de renda" : "Outra renda"}
                  </button>
                  {(showCustomIncomeInput || (!!data.income && !incomeRanges.includes(data.income))) && (
                    <div className="space-y-2">
                      <input
                        type="text"
                        maxLength={12}
                        value={customIncome}
                        onChange={e => {
                          setCustomIncome(e.target.value);
                          setData({ ...data, income: e.target.value });
                          if (incomeError) setIncomeError("");
                        }}
                        placeholder="Ex: R$ 4.500,00 ou 4500"
                        className="w-full rounded-2xl border border-border bg-input-background px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                      />
                      <p className="text-xs text-muted-foreground">Máx. 12 caracteres. Apenas números, ponto ou vírgula.</p>
                      {incomeError && <p className="text-xs text-destructive">{incomeError}</p>}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Goal */}
        {step === 2 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center mb-4">
              <Target size={24} className="text-accent" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Qual é seu objetivo?</h2>
            <p className="text-muted-foreground mb-6 text-sm">Escolha o que é mais importante para você agora.</p>
            <div className="grid grid-cols-1 gap-3">
              {goals.map(goal => (
                <button
                  key={goal.id}
                  onClick={() => setData({ ...data, goal: goal.id })}
                  className={`p-4 rounded-2xl border text-left transition-all min-h-[44px] ${data.goal === goal.id ? "border-accent bg-accent/5" : "border-border bg-card hover:border-accent/40"}`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{goal.icon}</span>
                    <div>
                      <div className={`font-semibold text-sm ${data.goal === goal.id ? "text-accent" : "text-foreground"}`}>{goal.label}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{goal.description}</div>
                    </div>
                    {data.goal === goal.id && <Check size={16} className="text-accent ml-auto" />}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Profile */}
        {step === 3 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="w-12 h-12 rounded-2xl bg-warning/10 flex items-center justify-center mb-4">
              <Lightbulb size={24} style={{ color: "var(--warning)" }} />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Qual é seu perfil?</h2>
            <p className="text-muted-foreground mb-6 text-sm">Sem julgamentos — isso nos ajuda a personalizar sua experiência.</p>
            <div className="space-y-3">
              {profiles.map(p => (
                <button
                  key={p.id}
                  onClick={() => setData({ ...data, profile: p.id })}
                  className={`w-full p-4 rounded-2xl border text-left transition-all min-h-[44px] ${data.profile === p.id ? "border-primary bg-primary/5" : `border-border bg-card hover:border-primary/40`}`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{p.icon}</span>
                    <span className={`font-medium text-sm ${data.profile === p.id ? "text-primary" : "text-foreground"}`}>{p.label}</span>
                    {data.profile === p.id && <Check size={16} className="text-primary ml-auto" />}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 4: Strategy */}
        {step === 4 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
              <BarChart2 size={24} className="text-primary" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Escolha sua estratégia</h2>
            <p className="text-muted-foreground mb-6 text-sm">Como você quer organizar seu orçamento? Você pode mudar depois.</p>
            <div className="space-y-3">
              {strategies.map(s => (
                <button
                  key={s.id}
                  onClick={() => setData({ ...data, strategy: s.id })}
                  className={`w-full p-4 rounded-2xl border text-left transition-all min-h-[44px] ${data.strategy === s.id ? "border-primary bg-primary/5" : "border-border bg-card hover:border-primary/40"}`}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-xl mt-0.5">{s.icon}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`font-semibold text-sm ${data.strategy === s.id ? "text-primary" : "text-foreground"}`}>{s.label}</span>
                        {s.highlight && <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">Recomendado</span>}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{s.description}</p>
                    </div>
                    {data.strategy === s.id && <Check size={16} className="text-primary mt-0.5" />}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center gap-3 mt-8">
          {step > 1 && (
            <button
              onClick={() => setStep(s => s - 1)}
              className="flex items-center gap-2 px-5 py-3 rounded-xl border border-border text-foreground hover:bg-muted transition-all min-h-[44px] font-medium text-sm"
            >
              <ChevronLeft size={16} />
              Voltar
            </button>
          )}
          <button
            onClick={next}
            disabled={!canNext()}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all min-h-[44px] ${canNext() ? "bg-primary text-white hover:bg-primary/90 active:scale-[0.98]" : "bg-muted text-muted-foreground cursor-not-allowed dark:bg-slate-800 dark:text-slate-400"}`}
          >
            {step === totalSteps ? "Começar agora! 🚀" : "Continuar"}
            {step < totalSteps && <ChevronRight size={16} />}
          </button>
        </div>
      </div>
    </div>
  );
}
