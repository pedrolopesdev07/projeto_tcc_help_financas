import { useState } from "react";
import { LayoutDashboard, ArrowLeftRight, Target, BarChart2, BookOpen, Settings, TrendingUp, ChevronRight, LogOut } from "lucide-react";
import type { OnboardingData } from "./OnboardingScreen";

interface AppLayoutProps {
  children: React.ReactNode;
  activePage: string;
  onNavigate: (page: string) => void;
  userData: OnboardingData;
  onLogout: () => void;
}

const navItems = [
  { id: "dashboard", icon: LayoutDashboard, label: "Início" },
  { id: "transactions", icon: ArrowLeftRight, label: "Transações" },
  { id: "goals", icon: Target, label: "Metas" },
  { id: "reports", icon: BarChart2, label: "Relatórios" },
  { id: "education", icon: BookOpen, label: "Aprender" },
];

export function AppLayout({ children, activePage, onNavigate, userData, onLogout }: AppLayoutProps) {
  const [sidebarExpanded, setSidebarExpanded] = useState(true);

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className={`hidden md:flex flex-col transition-all duration-300 bg-card border-r border-border h-full ${sidebarExpanded ? "w-56" : "w-16"}`}>
        {/* Logo */}
        <div className={`flex items-center h-16 px-4 border-b border-border gap-3 shrink-0`}>
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shrink-0">
            <TrendingUp size={18} className="text-white" />
          </div>
          {sidebarExpanded && <span className="font-bold text-foreground text-sm whitespace-nowrap">Help Finanças</span>}
        </div>

        {/* Nav items */}
        <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
          {navItems.map(item => {
            const Icon = item.icon;
            const active = activePage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                title={!sidebarExpanded ? item.label : undefined}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left min-h-[44px] ${active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}
              >
                <Icon size={18} className="shrink-0" />
                {sidebarExpanded && <span className="text-sm font-medium whitespace-nowrap">{item.label}</span>}
              </button>
            );
          })}
        </nav>

        {/* Bottom: Settings + User */}
        <div className="px-2 pb-4 space-y-1">
          <button
            onClick={() => onNavigate("settings")}
            title={!sidebarExpanded ? "Configurações" : undefined}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left min-h-[44px] ${activePage === "settings" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}
          >
            <Settings size={18} className="shrink-0" />
            {sidebarExpanded && <span className="text-sm font-medium">Configurações</span>}
          </button>

          <div className={`flex items-center gap-3 px-3 py-2.5 rounded-xl bg-muted/50 ${sidebarExpanded ? "" : "justify-center"}`}>
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-xs font-bold shrink-0">
              {userData.name.charAt(0).toUpperCase() || "U"}
            </div>
            {sidebarExpanded && (
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-foreground truncate">{userData.name || "Usuário"}</div>
                <div className="text-xs text-muted-foreground truncate">{userData.income}</div>
              </div>
            )}
            {sidebarExpanded && (
              <button onClick={onLogout} title="Sair" className="text-muted-foreground hover:text-destructive transition-colors">
                <LogOut size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Toggle */}
        <button
          onClick={() => setSidebarExpanded(!sidebarExpanded)}
          className="absolute left-52 top-16 -translate-y-1/2 w-5 h-8 bg-card border border-border rounded-r-lg flex items-center justify-center text-muted-foreground hover:text-foreground transition-all"
          style={{ left: sidebarExpanded ? "222px" : "62px" }}
        >
          <ChevronRight size={12} className={`transition-transform ${sidebarExpanded ? "rotate-180" : ""}`} />
        </button>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto pb-20 md:pb-0">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50 safe-area-inset-bottom">
        <div className="flex items-center justify-around px-2 py-2">
          {navItems.map(item => {
            const Icon = item.icon;
            const active = activePage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl min-w-[44px] min-h-[44px] justify-center transition-all ${active ? "text-primary" : "text-muted-foreground"}`}
              >
                <Icon size={20} />
                <span className="text-[10px] font-medium">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
