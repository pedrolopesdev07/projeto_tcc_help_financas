import { useState } from "react";
import { TrendingUp, Eye, EyeOff, Mail, Lock, User } from "lucide-react";

interface AuthScreenProps {
  onSubmit: (mode: "login" | "signup", data: { name: string; email: string; password: string }) => Promise<void>;
}

export function AuthScreen({ onSubmit }: AuthScreenProps) {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState("");

  const validate = () => {
    const e: Record<string, string> = {};
    if (mode === "signup" && !form.name.trim()) e.name = "Nome é obrigatório";
    if (!form.email.includes("@")) e.email = "E-mail inválido";
    if (form.password.length < 6) e.password = "Senha deve ter ao menos 6 caracteres";
    return e;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setServerError("");

    try {
      await onSubmit(mode, form);
    } catch (error) {
      setServerError(error instanceof Error ? error.message : 'Erro ao conectar com o servidor.');
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background">
      {/* Left panel */}
      <div className="hidden md:flex flex-col justify-between bg-primary text-primary-foreground p-10 w-[420px] shrink-0 dark:bg-slate-950 dark:text-white">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/20 dark:bg-white/10 flex items-center justify-center">
            <TrendingUp size={22} className="text-white" />
          </div>
          <span className="text-xl font-bold">Help Finanças</span>
        </div>
        <div>
          <h2 className="text-3xl font-bold leading-tight mb-4">
            Cuide do seu dinheiro com clareza e confiança
          </h2>
          <p className="text-white/70 dark:text-slate-300 text-sm leading-relaxed">
            Registre, planeje e conquiste suas metas financeiras com uma ferramenta feita para todos — sem jargões, sem complicação.
          </p>
          <div className="mt-8 space-y-3">
            {["✅ Controle de receitas e despesas", "🎯 Metas personalizadas", "📚 Educação financeira integrada", "🏆 Conquistas e gamificação"].map((item) => (
              <div key={item} className="text-sm text-white/80 dark:text-slate-200">{item}</div>
            ))}
          </div>
        </div>
        <p className="text-white/40 dark:text-slate-400 text-xs">© 2026 Help Finanças. Todos os direitos reservados.</p>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="flex md:hidden items-center gap-2 mb-8 justify-center">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
              <TrendingUp size={18} className="text-white" />
            </div>
            <span className="text-lg font-bold text-foreground">Help Finanças</span>
          </div>

          <h1 className="text-2xl font-bold text-foreground mb-1">
            {mode === "login" ? "Bem-vindo de volta!" : "Criar conta grátis"}
          </h1>
          <p className="text-muted-foreground text-sm mb-6">
            {mode === "login" ? "Entre para continuar sua jornada financeira" : "Comece sua jornada rumo à saúde financeira"}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "signup" && (
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Nome completo</label>
                <div className="relative">
                  <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Seu nome"
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    className={`w-full pl-10 pr-4 py-3 rounded-xl bg-input-background border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all ${errors.name ? "border-destructive" : "border-border"}`}
                  />
                </div>
                {errors.name && <p className="text-destructive text-xs mt-1">{errors.name}</p>}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">E-mail</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="email"
                  placeholder="seu@email.com"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  className={`w-full pl-10 pr-4 py-3 rounded-xl bg-input-background border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all ${errors.email ? "border-destructive" : "border-border"}`}
                />
              </div>
              {errors.email && <p className="text-destructive text-xs mt-1">{errors.email}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Senha</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Mínimo 6 caracteres"
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  className={`w-full pl-10 pr-10 py-3 rounded-xl bg-input-background border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all ${errors.password ? "border-destructive" : "border-border"}`}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <p className="text-destructive text-xs mt-1">{errors.password}</p>}
            </div>

            {mode === "login" && (
              <div className="flex justify-end">
                <button type="button" className="text-xs text-primary hover:underline">Esqueceu a senha?</button>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 active:scale-[0.98] transition-all min-h-[44px]"
            >
              {mode === "login" ? "Entrar" : "Criar conta"}
            </button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            {mode === "login" ? "Não tem conta?" : "Já tem uma conta?"}{" "}
            <button
              type="button"
              onClick={() => { setMode(mode === "login" ? "signup" : "login"); setErrors({}); setServerError(""); }}
              className="text-primary font-semibold hover:underline"
            >
              {mode === "login" ? "Cadastre-se grátis" : "Entrar"}
            </button>
          </p>
          {serverError && <p className="text-destructive text-xs mt-2">{serverError}</p>}
        </div>
      </div>
    </div>
  );
}
