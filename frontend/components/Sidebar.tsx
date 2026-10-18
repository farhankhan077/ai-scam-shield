import { Shield, Activity, AlertTriangle, Settings, BarChart3, Bell, Zap } from "lucide-react";

const navItems = [
  { icon: Activity, label: "Live Monitor", id: "monitor" },
  { icon: AlertTriangle, label: "Alert Queue", id: "alerts" },
  { icon: BarChart3, label: "Analytics", id: "analytics" },
  { icon: Bell, label: "Notifications", id: "notifications" },
  { icon: Settings, label: "Settings", id: "settings" },
];

interface SidebarProps {
  connected: boolean;
  txCount: number;
  criticalCount: number;
  currentView: string;
  onViewChange: (view: string) => void;
}

export default function Sidebar({ connected, txCount, criticalCount, currentView, onViewChange }: SidebarProps) {
  return (
    <aside className="w-16 lg:w-60 h-screen bg-panel border-r border-border-main flex flex-col flex-shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-3 p-4 border-b border-border-main">
        <div className="relative">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
            <Shield className="w-5 h-5 text-white" />
          </div>
          {/* Pulse ring when connected */}
          {connected && (
            <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 border-2 border-panel animate-pulse" />
          )}
        </div>
        <div className="hidden lg:block">
          <p className="font-bold text-sm text-text-main tracking-tight leading-none">Scam Shield</p>
          <p className="text-[10px] text-text-muted mt-0.5">AI Fraud Prevention</p>
        </div>
      </div>

      {/* Live Stats */}
      <div className="hidden lg:block m-3 p-3 rounded-xl bg-panel-hover border border-border-main">
        <div className="flex items-center gap-2 mb-2">
          <Zap className="w-3.5 h-3.5 text-yellow-400" />
          <span className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">Live Stats</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="text-center">
            <p className="text-lg font-bold text-text-main">{txCount}</p>
            <p className="text-[9px] text-text-muted">Total Txns</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-red-500">{criticalCount}</p>
            <p className="text-[9px] text-text-muted">Critical</p>
          </div>
        </div>
        <div className="mt-2 flex items-center gap-1.5">
          <span className={`w-1.5 h-1.5 rounded-full ${connected ? "bg-emerald-500 animate-pulse" : "bg-slate-500"}`} />
          <span className={`text-[10px] font-medium ${connected ? "text-emerald-500" : "text-text-muted"}`}>
            {connected ? "FedNow Stream Live" : "Connecting..."}
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-2 space-y-0.5">
        {navItems.map(({ icon: Icon, label, id }) => {
          const dynamicBadge = id === "alerts" && criticalCount > 0 ? criticalCount : null;
          return (
          <button
            key={id}
            id={`nav-${id}`}
            onClick={() => onViewChange(id)}
            className={`
              w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
              ${currentView === id
                ? "bg-blue-600/10 text-blue-600 dark:bg-blue-600/20 dark:text-blue-400 border border-blue-500/30"
                : "text-text-muted hover:text-text-main hover:bg-panel-hover"
              }
            `}
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            <span className="hidden lg:block">{label}</span>
            {dynamicBadge != null && (
              <span className="hidden lg:flex ml-auto w-5 h-5 rounded-full bg-red-500 text-[10px] font-bold text-white items-center justify-center">
                {dynamicBadge}
              </span>
            )}
          </button>
        )})}
      </nav>

      {/* Footer */}
      <div className="hidden lg:block p-3 border-t border-border-main">
        <div className="flex items-center gap-2 p-2 rounded-lg bg-panel-hover">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white">
            A
          </div>
          <div>
            <p className="text-xs font-semibold text-text-main">Analyst Team</p>
            <p className="text-[9px] text-text-muted">Tier 1 Fraud Ops</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
