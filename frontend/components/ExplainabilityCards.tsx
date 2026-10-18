"use client";
import { AlertTriangle, Clock, Zap, Shield, TrendingUp, User } from "lucide-react";

const FLAG_ICONS: Record<string, React.ElementType> = {
  beneficiary: User,
  new: User,
  velocity: Zap,
  speed: Zap,
  amount: TrendingUp,
  large: TrendingUp,
  account: Clock,
  age: Clock,
  days: Clock,
  old: Clock,
};

function getIcon(flag: string): React.ElementType {
  const lower = flag.toLowerCase();
  for (const [keyword, Icon] of Object.entries(FLAG_ICONS)) {
    if (lower.includes(keyword)) return Icon;
  }
  return AlertTriangle;
}

function getFlagStyle(flag: string) {
  const lower = flag.toLowerCase();
  if (lower.includes("new") || lower.includes("beneficiary") || lower.includes("age") || lower.includes("days") || lower.includes("old")) {
    return { bg: "bg-orange-500/10", border: "border-orange-500/30", text: "text-orange-300", iconColor: "text-orange-400" };
  }
  if (lower.includes("velocity") || lower.includes("speed") || lower.includes("/hr")) {
    return { bg: "bg-red-500/10", border: "border-red-500/30", text: "text-red-300", iconColor: "text-red-400" };
  }
  if (lower.includes("amount") || lower.includes("large") || lower.includes("$")) {
    return { bg: "bg-yellow-500/10", border: "border-yellow-500/30", text: "text-yellow-300", iconColor: "text-yellow-400" };
  }
  return { bg: "bg-blue-500/10", border: "border-blue-500/30", text: "text-blue-300", iconColor: "text-blue-400" };
}

interface ExplainabilityCardsProps {
  flags: string[];
  patternMatch?: string;
}

export default function ExplainabilityCards({ flags, patternMatch }: ExplainabilityCardsProps) {
  return (
    <div className="space-y-2">
      {patternMatch && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-violet-500/10 border border-violet-500/30">
          <Shield className="w-3.5 h-3.5 text-violet-400 flex-shrink-0" />
          <div>
            <span className="text-[9px] font-bold uppercase tracking-widest text-violet-500">Pattern Match</span>
            <p className="text-xs font-semibold text-violet-300">{patternMatch}</p>
          </div>
        </div>
      )}
      <div className="grid grid-cols-1 gap-2">
        {flags.map((flag, i) => {
          const Icon = getIcon(flag);
          const style = getFlagStyle(flag);
          return (
            <div
              key={i}
              className={`flex items-start gap-2.5 px-3 py-2.5 rounded-lg border ${style.bg} ${style.border}`}
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <Icon className={`w-4 h-4 flex-shrink-0 mt-0.5 ${style.iconColor}`} />
              <p className={`text-xs leading-relaxed ${style.text}`}>{flag}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
