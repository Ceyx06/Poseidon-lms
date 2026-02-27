// src/components/dashboard/StatsCards.tsx
import { cn } from "@/lib/utils";

interface Props {
  stats: {
    totalDocuments: number;
    totalVessels: number;
    totalCrew: number;
    expired: number;
    critical: number;
    warning: number;
    caution: number;
    safe: number;
  };
}

export default function StatsCards({ stats }: Props) {
  const cards = [
    {
      label: "Total Documents",
      value: stats.totalDocuments,
      icon: "📄",
      sub: `${stats.totalVessels} vessels · ${stats.totalCrew} crew`,
      color: "from-[#1a9bdc]/20 to-transparent",
      border: "border-[#1a9bdc]/20",
      textColor: "text-[#1a9bdc]",
    },
    {
      label: "Expired",
      value: stats.expired,
      icon: "🔴",
      sub: "Require immediate renewal",
      color: "from-red-500/20 to-transparent",
      border: "border-red-500/20",
      textColor: "text-red-400",
    },
    {
      label: "Expiring ≤30d",
      value: stats.critical,
      icon: "🟠",
      sub: "Critical attention needed",
      color: "from-orange-500/20 to-transparent",
      border: "border-orange-500/20",
      textColor: "text-orange-400",
    },
    {
      label: "Expiring 31–60d",
      value: stats.warning,
      icon: "🟡",
      sub: "Plan renewal soon",
      color: "from-yellow-500/20 to-transparent",
      border: "border-yellow-500/20",
      textColor: "text-yellow-400",
    },
    {
      label: "Expiring 61–90d",
      value: stats.caution,
      icon: "🔵",
      sub: "Monitor upcoming",
      color: "from-cyan-500/20 to-transparent",
      border: "border-cyan-500/20",
      textColor: "text-cyan-400",
    },
    {
      label: "Fully Valid",
      value: stats.safe,
      icon: "🟢",
      sub: "More than 90 days",
      color: "from-emerald-500/20 to-transparent",
      border: "border-emerald-500/20",
      textColor: "text-emerald-400",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className={cn(
            "relative rounded-2xl bg-[#111e35] border overflow-hidden p-5 hover:bg-[#162440] transition-colors duration-200",
            card.border
          )}
        >
          <div className={cn("absolute inset-0 bg-gradient-to-br opacity-50", card.color)} />
          <div className="relative">
            <div className="text-xl mb-3">{card.icon}</div>
            <div className={cn("font-syne font-bold text-3xl", card.textColor)}>
              {card.value}
            </div>
            <div className="text-slate-300 text-xs font-dm font-medium mt-1">{card.label}</div>
            <div className="text-slate-500 text-[10px] font-dm mt-0.5">{card.sub}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
