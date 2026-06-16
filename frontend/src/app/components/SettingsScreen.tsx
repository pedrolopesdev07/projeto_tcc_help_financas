import { useEffect, useState } from "react";
import { User, Mail, Lock, Wallet, Check, Eye, EyeOff, LogOut, Moon, Sun, AlertTriangle, X } from "lucide-react";
import type { OnboardingData } from "./OnboardingScreen";

interface SettingsProps {
  userData: OnboardingData;
  onUpdateUser: (data: Partial<OnboardingData>) => void;
  onLogout: () => void;
  onDeleteAccount: () => void;
  theme: "light" | "dark";
  onToggleTheme: () => void;
}

const incomeRanges = [
  "Até R$ 1.500",
  "R$ 1.500 a R$ 3.000",
  "R$ 3.000 a R$ 6.000",
  "R$ 6.000 a R$ 12.000",
  "Acima de R$ 12.000",
];

const strategies = [
  { id: "50-30-20", label: "Regra 50-30-20", description: "50% Essenciais, 30% Desejos, 20% Prioridades." },
  { id: "zero", label: "Orçamento Base Zero", description: "Cada centavo tem um destino. Controle total." },
  { id: "80-20", label: "Regra 80/20", description: "Poupe 20% assim que receber e use 80% livremente." },
];

export function SettingsScreen({ userData, onUpdateUser, onLogout, onDeleteAccount, theme, onToggleTheme }: SettingsProps) {
  const [income, setIncome] = useState(userData.income);
  const [incomeOptions, setIncomeOptions] = useState<string[]>(incomeRanges);
  const [selectedStrategy, setSelectedStrategy] = useState(userData.strategy);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [profileName, setProfileName] = useState(userData.name);
  const [profileSurname, setProfileSurname] = useState("");
  const [profileEmail, setProfileEmail] = useState(userData.email || "");
  const [profilePassword, setProfilePassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [saved, setSaved] = useState(false);
  const [profileStatus, setProfileStatus] = useState("");
  const [showDelete, setShowDelete] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [showCustomIncomeInput, setShowCustomIncomeInput] = useState(false);
  const [customIncome, setCustomIncome] = useState("");
  const [incomeError, setIncomeError] = useState("");
  const [saving, setSaving] = useState(false);

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

  useEffect(() => {
    const isRangeIncome = incomeRanges.includes(userData.income);
    setIncome(userData.income);
    setSelectedStrategy(userData.strategy);
    setProfileName(userData.name);
    setProfileEmail(userData.email || "");
    const [first, ...rest] = userData.name.split(" ");
    setProfileName(first || "");
    setProfileSurname(rest.join(" ") || "");
    const isCustomIncome = !!userData.income && !incomeRanges.includes(userData.income);
    setShowCustomIncomeInput(isCustomIncome);
    setCustomIncome(isCustomIncome ? userData.income : "");
    setIncomeError("");
    setIncomeOptions(() => {
      if (!isCustomIncome) return incomeRanges;
      return [...new Set([...incomeRanges, userData.income])];
    });
  }, [userData]);

  const handleSavePreferences = async () => {
    const isCustomIncome = income && !incomeRanges.includes(income);
    if (showCustomIncomeInput || isCustomIncome) {
      const valueToValidate = customIncome || income;
      if (!valueToValidate || !isValidIncomeInput(valueToValidate)) {
        setIncomeError("Digite uma renda válida em reais, até 12 caracteres.");
        return;
      }
    }

    setIncomeError("");
    const finalIncome = income;
    if (finalIncome && !incomeRanges.includes(finalIncome)) {
      setIncomeOptions(prev => [...new Set([...prev, finalIncome])]);
      setCustomIncome(finalIncome);
      setShowCustomIncomeInput(true);
    } else {
      setShowCustomIncomeInput(false);
    }

    setSaving(true);
    try {
      await onUpdateUser({
        income: finalIncome,
        strategy: selectedStrategy,
        strategyConfig: selectedStrategy === "zero" ? userData.strategyConfig ?? { strategy: "zero" } : undefined,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (error) {
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveProfile = () => {
    const fullName = profileSurname.trim() ? `${profileName.trim()} ${profileSurname.trim()}` : profileName.trim();
    onUpdateUser({ name: fullName, email: profileEmail.trim(), password: profilePassword.trim() });
    setProfilePassword("");
    setProfileStatus("Perfil atualizado com sucesso!");
    setTimeout(() => setProfileStatus(""), 3000);
    setProfileModalOpen(false);
  };

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-foreground">Configurações</h1>
        <p className="text-sm text-muted-foreground">Gerencie seu perfil e preferências em um só lugar.</p>
      </div>

      <div className="bg-card rounded-2xl border border-border p-5 mb-4">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center text-white text-xl font-bold">
            {userData.name.charAt(0)?.toUpperCase() || "U"}
          </div>
          <div>
            <p className="font-semibold text-foreground">{userData.name || "Usuário"}</p>
            <p className="text-sm text-muted-foreground">{userData.email || "Sem e-mail cadastrado"}</p>
          </div>
          <button
            type="button"
            onClick={() => setProfileModalOpen(true)}
            className="ml-auto rounded-xl border border-border bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-all"
          >
            Editar perfil
          </button>
        </div>

        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Tema do aplicativo</label>
            <button
              type="button"
              onClick={onToggleTheme}
              className="w-full px-4 py-3 rounded-xl bg-card border border-border text-foreground font-medium hover:bg-muted transition-all"
            >
              {theme === "dark" ? <><Sun size={16} className="inline mr-2" />Desativar modo escuro</> : <><Moon size={16} className="inline mr-2" />Ativar modo escuro</>}
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Minha Estratégia Financeira</label>
            <div className="grid grid-cols-1 gap-3">
              {strategies.map(strategy => (
                <button
                  type="button"
                  key={strategy.id}
                  onClick={() => setSelectedStrategy(strategy.id)}
                  className={`w-full rounded-2xl border p-4 text-left transition-all ${selectedStrategy === strategy.id ? "border-primary bg-primary/5" : "border-border bg-background hover:border-primary/40"}`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className={`font-semibold ${selectedStrategy === strategy.id ? "text-primary" : "text-foreground"}`}>{strategy.label}</p>
                      <p className="text-xs text-muted-foreground mt-1">{strategy.description}</p>
                    </div>
                    {selectedStrategy === strategy.id && <Check size={18} className="text-primary" />}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Renda Mensal Líquida</label>
            <div className="grid grid-cols-1 gap-2">
              {incomeOptions.map(option => {
                const isCustomOption = !incomeRanges.includes(option);
                const selected = income === option;
                return (
                  <div key={option} className="relative">
                    <button
                      type="button"
                      onClick={() => {
                        setIncome(option);
                        setCustomIncome(isCustomOption ? option : "");
                        setShowCustomIncomeInput(isCustomOption);
                        setIncomeError("");
                      }}
                      className={`w-full py-3 px-4 rounded-xl border text-sm font-medium text-left transition-all min-h-[44px] ${selected ? "border-primary bg-primary/5 text-primary" : "border-border bg-background text-foreground hover:border-primary/40"}`}
                    >
                      {option}
                    </button>
                    {isCustomOption && (
                      <button
                        type="button"
                        onClick={() => {
                          setIncomeOptions(prev => prev.filter(item => item !== option));
                          if (income === option) {
                            setIncome("");
                            setShowCustomIncomeInput(false);
                            setCustomIncome("");
                          }
                        }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-destructive"
                        title="Remover opção personalizada"
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>
                );
              })}
              <button
                type="button"
                onClick={() => {
                  setShowCustomIncomeInput(true);
                  setIncome(customIncome || "");
                  setIncomeError("");
                }}
                className="py-3 px-4 rounded-xl border text-sm font-medium text-left transition-all min-h-[44px] border-border bg-background text-foreground hover:border-primary/40"
              >
                Outra renda
              </button>
              {(showCustomIncomeInput || (!!income && !incomeRanges.includes(income))) && (
                <div className="space-y-2">
                  <input
                    type="text"
                    maxLength={12}
                    value={customIncome}
                    onChange={e => {
                      setCustomIncome(e.target.value);
                      setIncome(e.target.value);
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

          <button
            type="button"
            onClick={handleSavePreferences}
            disabled={saving}
            className={`w-full py-3 rounded-xl font-semibold text-sm transition-all min-h-[44px] ${saved ? "bg-green-500 text-white" : "bg-primary text-white hover:bg-primary/90"} ${saving ? "opacity-70 cursor-not-allowed" : ""}`}
          >
            {saving ? "Salvando..." : saved ? "Preferências salvas" : "Salvar preferências"}
          </button>
        </div>
      </div>

      <div className="bg-card rounded-2xl border border-border p-5 mb-4">
        <h2 className="text-sm font-semibold text-foreground mb-3">Conta</h2>
        <div className="space-y-2">
          <button
            type="button"
            onClick={onLogout}
            className="w-full flex items-center gap-3 rounded-xl border border-border px-4 py-3 text-left text-sm font-medium text-foreground hover:bg-muted transition-all"
          >
            <LogOut size={18} className="text-muted-foreground" /> Sair da conta
          </button>
          <button
            type="button"
            onClick={() => setShowDelete(true)}
            className="w-full flex items-center gap-3 rounded-xl border border-transparent bg-red-50 px-4 py-3 text-left text-sm font-semibold text-destructive hover:bg-red-100 transition-all"
          >
            <AlertTriangle size={18} className="text-destructive" /> Excluir conta e dados associados
          </button>
        </div>
      </div>

      <p className="text-center text-xs text-muted-foreground pb-4">Help Finanças v1.0 · © 2026</p>

      {profileModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 p-4 flex items-center justify-center">
          <div className="w-full max-w-lg rounded-3xl bg-card border border-border p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4 mb-5">
              <div>
                <p className="text-lg font-bold text-foreground">Editar perfil</p>
                <p className="text-sm text-muted-foreground">Atualize nome, e-mail ou senha.</p>
              </div>
              <button type="button" onClick={() => setProfileModalOpen(false)} className="rounded-full border border-border p-2 text-muted-foreground hover:text-foreground transition-all">✕</button>
            </div>

            <div className="grid gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Nome</label>
                <input
                  type="text"
                  value={profileName}
                  onChange={e => setProfileName(e.target.value)}
                  className="w-full rounded-2xl border border-border bg-input-background px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Sobrenome</label>
                <input
                  type="text"
                  value={profileSurname}
                  onChange={e => setProfileSurname(e.target.value)}
                  className="w-full rounded-2xl border border-border bg-input-background px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">E-mail</label>
                <input
                  type="email"
                  value={profileEmail}
                  onChange={e => setProfileEmail(e.target.value)}
                  className="w-full rounded-2xl border border-border bg-input-background px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Senha</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={profilePassword}
                    onChange={e => setProfilePassword(e.target.value)}
                    placeholder="Deixe em branco para manter atual"
                    className="w-full rounded-2xl border border-border bg-input-background px-4 py-3 pr-10 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Foto de perfil não disponível no momento.</p>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setProfileModalOpen(false)}
                className="flex-1 rounded-2xl border border-border px-4 py-3 text-sm font-medium text-foreground hover:bg-muted transition-all"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveProfile}
                className="flex-1 rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-white hover:bg-primary/90 transition-all"
              >
                Salvar perfil
              </button>
            </div>

            {profileStatus && <p className="mt-4 text-sm text-green-500">{profileStatus}</p>}
          </div>
        </div>
      )}

      {showDelete && (
        <div className="fixed inset-0 z-50 bg-black/50 p-4 flex items-center justify-center">
          <div className="w-full max-w-sm rounded-3xl bg-card border border-border p-6 shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle size={24} className="text-destructive" />
            </div>
            <h2 className="text-lg font-bold text-foreground text-center mb-2">Excluir conta permanentemente</h2>
            <p className="text-sm text-muted-foreground text-center mb-4">
              Esta ação é <strong className="text-foreground">irreversível</strong>. Todos os seus dados serão removidos.
            </p>
            <p className="text-sm font-medium text-foreground mb-2 text-center">Digite <strong>EXCLUIR</strong> para confirmar</p>
            <input
              type="text"
              value={deleteConfirm}
              onChange={e => setDeleteConfirm(e.target.value)}
              placeholder="EXCLUIR"
              className="w-full rounded-2xl border border-destructive/30 bg-input-background px-4 py-3 text-center text-foreground focus:outline-none focus:ring-2 focus:ring-destructive/40 mb-4"
            />
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => { setShowDelete(false); setDeleteConfirm(""); }}
                className="flex-1 rounded-2xl border border-border px-4 py-3 text-sm font-medium text-foreground hover:bg-muted transition-all"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={deleteConfirm !== "EXCLUIR"}
                onClick={() => { if (deleteConfirm === "EXCLUIR") onDeleteAccount(); }}
                className={`flex-1 rounded-2xl px-4 py-3 text-sm font-semibold transition-all ${deleteConfirm === "EXCLUIR" ? "bg-destructive text-white hover:bg-destructive/90" : "bg-muted text-muted-foreground cursor-not-allowed"}`}
              >
                Excluir tudo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
