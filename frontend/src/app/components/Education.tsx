import { useState } from "react";
import { BookOpen, Clock, Trophy, Lock, ChevronRight, X, Star, CheckCircle } from "lucide-react";
import type { Transaction } from "./Transactions";

interface EducationProps {
  transactions: Transaction[];
}

const articles = [
  {
    id: "1",
    group: "Educação financeira básica",
    title: "Entenda a regra 50-30-20",
    category: "Estratégias 50/30/20",
    emoji: "📊",
    readTime: "4 min",
    difficulty: "Iniciante",
    color: "border-green-300",
    tag: "bg-green-100 text-green-700",
    content: `A regra 50-30-20 é uma forma simples de dividir sua renda líquida em três blocos. Use 50% para necessidades essenciais, 30% para desejos e 20% para prioridades financeiras. Essa estratégia ajuda a manter as contas em dia sem perder a qualidade de vida.`,
  },
  {
    id: "2",
    group: "Educação financeira básica",
    title: "Quando usar a estratégia 80-20",
    category: "Estratégia 80/20",
    emoji: "⚖️",
    readTime: "4 min",
    difficulty: "Intermediário",
    color: "border-violet-300",
    tag: "bg-violet-100 text-violet-700",
    content: `A estratégia 80-20 concentra mais peso nas despesas fixas. Ela é útil quando você tem muitos gastos essenciais ou recebe uma renda variável. Nesse modelo, 80% da renda cobre despesas, e 20% vai para poupança, investimentos ou pagamento de dívidas.`,
  },
  {
    id: "3",
    group: "Educação financeira básica",
    title: "Como aplicar o orçamento zero",
    category: "Orçamento zero",
    emoji: "🧾",
    readTime: "5 min",
    difficulty: "Intermediário",
    color: "border-slate-300",
    tag: "bg-slate-100 text-slate-700",
    content: `O orçamento zero destina um propósito para cada real que entra no orçamento. No fim do mês, todas as receitas devem estar alocadas em uma categoria. Esse método é ótimo para quem quer ter controle total das despesas e evitar sobra sem planejamento.`,
  },
  {
    id: "4",
    group: "Dicas sobre investimentos",
    title: "Por que começar pelo Tesouro Direto",
    category: "Investimentos",
    emoji: "📈",
    readTime: "5 min",
    difficulty: "Iniciante",
    color: "border-purple-300",
    tag: "bg-purple-100 text-purple-700",
    content: `O Tesouro Direto é uma das formas mais seguras de investimento para quem está começando. Ele é garantido pelo governo e não exige grandes valores iniciais. A melhor estratégia é começar pelo Tesouro Selic e depois diversificar com títulos IPCA e prefixados.`,
  },
  {
    id: "5",
    group: "Dicas sobre investimentos",
    title: "Como usar juros compostos a seu favor",
    category: "Investimentos",
    emoji: "🧮",
    readTime: "4 min",
    difficulty: "Iniciante",
    color: "border-yellow-300",
    tag: "bg-yellow-100 text-yellow-700",
    content: `Juros compostos significam que os rendimentos também rendem. Quanto antes você começar, maior é a força do tempo. Pequenos aportes regulares podem crescer muito ao longo de anos. Por isso, disciplina e consistência são mais importantes do que alta rentabilidade.`,
  },
  {
    id: "6",
    group: "Dicas sobre investimentos",
    title: "Como montar uma carteira inicial",
    category: "Investimentos",
    emoji: "💼",
    readTime: "6 min",
    difficulty: "Intermediário",
    color: "border-blue-300",
    tag: "bg-blue-100 text-blue-700",
    content: `Uma carteira inicial deve equilibrar segurança e crescimento. Combine produtos seguros como Tesouro Selic com opções de médio prazo, como CDBs e fundos de índice. A ideia é distribuir o risco e manter liquidez para mudanças na sua vida financeira.`,
  },
  {
    id: "7",
    group: "Dicas para guardar dinheiro",
    title: "Como construir uma reserva de emergência",
    category: "Poupança",
    emoji: "🏦",
    readTime: "5 min",
    difficulty: "Iniciante",
    color: "border-cyan-300",
    tag: "bg-cyan-100 text-cyan-700",
    content: `A reserva de emergência é o primeiro passo para uma base financeira sólida. O objetivo é guardar 3 a 6 meses das suas despesas fixas. Comece com aportes pequenos e automáticos, e escolha um investimento acessível com liquidez diária.`,
  },
  {
    id: "8",
    group: "Dicas para guardar dinheiro",
    title: "Pequenos hábitos que aumentam a economia",
    category: "Economia",
    emoji: "💡",
    readTime: "4 min",
    difficulty: "Iniciante",
    color: "border-emerald-300",
    tag: "bg-emerald-100 text-emerald-700",
    content: `Guardar mais não depende apenas de ganhar mais. Ajustes simples, como reduzir gastos com delivery, levar café de casa e revisar assinaturas, podem liberar dinheiro para investir. O importante é criar uma rotina financeira saudável.`,
  },
  {
    id: "9",
    group: "Dicas para guardar dinheiro",
    title: "Cartão de crédito: quando usar com responsabilidade",
    category: "Compras",
    emoji: "💳",
    readTime: "4 min",
    difficulty: "Iniciante",
    color: "border-orange-300",
    tag: "bg-orange-100 text-orange-700",
    content: `O cartão de crédito pode ajudar no controle de gastos, desde que você pague a fatura integralmente. Faça compras planejadas, evite parcelar sem necessidade e use o limite como ferramenta financeira, não como renda extra.`,
  },
  {
    id: "10",
    group: "Dicas para alcançar objetivos",
    title: "Como transformar objetivos em metas reais",
    category: "Planejamento",
    emoji: "🎯",
    readTime: "5 min",
    difficulty: "Intermediário",
    color: "border-rose-300",
    tag: "bg-rose-100 text-rose-700",
    content: `Objetivos financeiros ficam mais fáceis de alcançar quando são divididos em metas menores. Defina prazos, valores e passos claros. Isso traz clareza e ajuda a medir o progresso com mais segurança.`,
  },
  {
    id: "11",
    group: "Dicas para alcançar objetivos",
    title: "Foco financeiro: como manter a disciplina",
    category: "Planejamento",
    emoji: "🚀",
    readTime: "5 min",
    difficulty: "Intermediário",
    color: "border-teal-300",
    tag: "bg-teal-100 text-teal-700",
    content: `Manter o foco financeiro exige revisão constante do que é importante. Reavalie seus objetivos a cada mês, comemore pequenas vitórias e ajuste seu orçamento sempre que necessário. Isso ajuda a evitar decisões impulsivas e a construir confiança na sua estratégia.`,
  },
];

const badges = [
  { id: "first", emoji: "🌱", title: "Primeira Transação", desc: "Registrou sua primeira transação", condition: (txs: Transaction[]) => txs.length >= 1 },
  { id: "ten", emoji: "🔟", title: "10 Transações", desc: "10 transações registradas este mês", condition: (txs: Transaction[]) => txs.length >= 10 },
  { id: "twenty", emoji: "🏆", title: "20 Transações", desc: "20 transações! Você é consistente!", condition: (txs: Transaction[]) => txs.length >= 20 },
  { id: "income", emoji: "💰", title: "Primeira Receita", desc: "Registrou sua primeira receita", condition: (txs: Transaction[]) => txs.some(t => t.type === "receita") },
  { id: "saver", emoji: "🦸", title: "Poupador Iniciante", desc: "Manteve saldo positivo no mês", condition: (txs: Transaction[]) => {
    const now = new Date();
    const m = txs.filter(t => { const d = new Date(t.date); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear(); });
    const inc = m.filter(t => t.type === "receita").reduce((s, t) => s + t.amount, 0);
    const exp = m.filter(t => t.type === "despesa").reduce((s, t) => s + t.amount, 0);
    return inc > exp;
  }},
  { id: "categories", emoji: "🗂️", title: "Organizador", desc: "Usou 3+ categorias diferentes", condition: (txs: Transaction[]) => new Set(txs.map(t => t.category)).size >= 3 },
  { id: "streak", emoji: "🔥", title: "Na Sequência", desc: "Registrou transações em 3 dias seguidos", condition: (txs: Transaction[]) => txs.length >= 3 },
  { id: "fifty", emoji: "⭐", title: "50 Transações", desc: "Você é um mestre das finanças!", condition: (txs: Transaction[]) => txs.length >= 50 },
];

export function Education({ transactions }: EducationProps) {
  const [selectedArticle, setSelectedArticle] = useState<typeof articles[0] | null>(null);
  const [readArticles, setReadArticles] = useState<Set<string>>(new Set());
  const [confirmedArticles, setConfirmedArticles] = useState<Set<string>>(new Set());

  const unlockedBadges = badges.filter(b => b.condition(transactions));

  const groupedArticles = articles.reduce((groups, article) => {
    const group = article.group ?? "Outros";
    if (!groups[group]) groups[group] = [];
    groups[group].push(article);
    return groups;
  }, {} as Record<string, typeof articles[number][]>);

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-foreground">Hub de Educação</h1>
        <p className="text-sm text-muted-foreground">Explore guias, estratégias e dicas organizadas para você tomar decisões financeiras mais confiantes.</p>
      </div>

      {/* Badges section */}
      <div className="bg-card rounded-2xl border border-border p-5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Trophy size={18} className="text-yellow-500" />
            <h2 className="font-semibold text-foreground">Minhas Conquistas</h2>
          </div>
          <span className="text-sm text-muted-foreground">{unlockedBadges.length}/{badges.length} desbloqueadas</span>
        </div>

        <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
          {badges.map(badge => {
            const unlocked = unlockedBadges.some(b => b.id === badge.id);
            return (
              <div key={badge.id} title={`${badge.title}: ${badge.desc}`} className={`flex flex-col items-center gap-1 cursor-help`}>
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl transition-all ${unlocked ? "bg-yellow-50 border-2 border-yellow-300 shadow-sm" : "bg-muted border-2 border-border grayscale opacity-40"}`}>
                  {unlocked ? badge.emoji : <Lock size={16} className="text-muted-foreground" />}
                </div>
                <span className="text-[9px] text-center text-muted-foreground leading-tight line-clamp-2">{badge.title}</span>
              </div>
            );
          })}
        </div>

        {unlockedBadges.length > 0 && (
          <div className="mt-4 p-3 bg-yellow-50 rounded-xl border border-yellow-200">
            <div className="flex items-center gap-2">
              <Star size={14} className="text-yellow-500 fill-yellow-500 shrink-0" />
              <p className="text-xs text-yellow-700 font-medium">
                🎉 {unlockedBadges[unlockedBadges.length - 1].desc}! Continue assim!
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Articles */}
      <div className="mb-4">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="font-semibold text-foreground">Artigos Educativos</h2>
            <p className="text-sm text-muted-foreground">Conteúdo organizado por tema para facilitar sua leitura.</p>
          </div>
          <span className="text-[11px] uppercase tracking-[0.3em] text-primary font-semibold">Confirme a leitura</span>
        </div>
        <div className="space-y-6">
          {Object.entries(groupedArticles).map(([group, items]) => (
            <section key={group} className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-sm uppercase tracking-[0.24em] text-primary font-semibold">{group}</h3>
                <span className="text-[10px] text-muted-foreground">{items.length} artigos</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {items.map(article => (
                  <div
                    key={article.id}
                    role="button"
                    tabIndex={0}
                    onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { setSelectedArticle(article); setReadArticles(prev => new Set([...prev, article.id])); } }}
                    onClick={() => {
                      setSelectedArticle(article);
                      setReadArticles(prev => new Set([...prev, article.id]));
                    }}
                    className={`relative overflow-hidden rounded-2xl border border-border bg-card/95 p-4 text-left transition-all hover:shadow-lg hover:-translate-y-0.5 duration-200 ${article.color}`}
                  >
                    <div className="flex items-start justify-between mb-2 gap-2">
                      <span className="text-2xl">{article.emoji}</span>
                      <div className="flex items-center gap-2">
                        {confirmedArticles.has(article.id) ? (
                          <span className="text-[10px] inline-flex items-center gap-1 rounded-full bg-green-100 text-green-700 px-2 py-1 font-semibold">
                            <CheckCircle size={12} /> Confirmado
                          </span>
                        ) : (
                          <span className="text-[10px] rounded-full bg-muted text-muted-foreground px-2 py-1 uppercase tracking-[0.18em] font-semibold">Pendente</span>
                        )}
                        <ChevronRight size={14} className="text-muted-foreground" />
                      </div>
                    </div>
                    <h3 className="font-semibold text-foreground text-sm mb-1.5">{article.title}</h3>
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${article.tag}`}>{article.category}</span>
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <Clock size={10} />{article.readTime}
                      </span>
                      <span className="text-[10px] text-muted-foreground">{article.difficulty}</span>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      {confirmedArticles.has(article.id) ? (
                        <span className="text-[10px] rounded-full bg-green-100 text-green-700 px-2 py-1 font-semibold">Lido</span>
                      ) : (
                        <button
                          type="button"
                          onClick={e => {
                            e.stopPropagation();
                            setConfirmedArticles(prev => new Set(prev).add(article.id));
                          }}
                          className="text-[10px] rounded-full border border-muted/60 bg-muted/80 px-3 py-1 font-semibold text-foreground hover:bg-muted transition-all"
                        >
                          Marcar como lido
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>

      {/* Progress indicator */}
      <div className="bg-card rounded-2xl border border-border p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <BookOpen size={16} className="text-primary" />
            <span className="text-sm font-medium text-foreground">Progresso confirmado</span>
          </div>
          <span className="text-xs text-muted-foreground">{confirmedArticles.size}/{articles.length} confirmados</span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div className="h-full bg-primary rounded-full transition-all duration-700" style={{ width: `${(confirmedArticles.size / articles.length) * 100}%` }} />
        </div>
      </div>

      {/* Article Modal */}
      {selectedArticle && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end md:items-center justify-center p-4">
          <div className="bg-card rounded-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto shadow-2xl animate-in slide-in-from-bottom-4 duration-300">
            <div className="flex items-center justify-between p-5 border-b border-border sticky top-0 bg-card z-10">
              <div className="flex items-center gap-2">
                <span className="text-xl">{selectedArticle.emoji}</span>
                <div>
                  <h2 className="font-bold text-foreground text-sm">{selectedArticle.title}</h2>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${selectedArticle.tag}`}>{selectedArticle.category}</span>
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1"><Clock size={10} />{selectedArticle.readTime}</span>
                  </div>
                </div>
              </div>
              <button onClick={() => setSelectedArticle(null)} className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground">
                <X size={16} />
              </button>
            </div>

            <div className="p-5">
              <div className="prose prose-sm max-w-none text-foreground">
                {selectedArticle.content.split("\n\n").map((paragraph, i) => (
                  <div key={i} className="mb-4">
                    {paragraph.split("\n").map((line, j) => (
                      <p key={j} className="text-sm text-muted-foreground leading-relaxed mb-1">{line.replace(/\*\*/g, "")}</p>
                    ))}
                  </div>
                ))}
              </div>

              <div className="mt-6 rounded-3xl border border-primary/20 bg-primary/5 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-foreground">Confirme a leitura</p>
                    <p className="text-xs text-muted-foreground mt-1">Clique no botão abaixo quando terminar de ler o artigo.</p>
                  </div>
                  <button
                    onClick={() => {
                      setConfirmedArticles(prev => {
                        const next = new Set(prev);
                        if (selectedArticle) next.add(selectedArticle.id);
                        return next;
                      });
                      setSelectedArticle(null);
                    }}
                    className="rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-white hover:bg-primary/90 transition-all"
                  >
                    Confirmar leitura
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
