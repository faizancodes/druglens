"use client";

import { useMemo } from "react";
import { TrendingUp, AlertTriangle, Skull, Activity, Salad, Users } from "lucide-react";
import type { AdverseEventSummary, DrugFoodInteraction } from "@/lib/types";
import { RiskBadge } from "@/components/ui/Badge";
import { LoadingState } from "@/components/ui/LoadingState";
import { cn, formatNumber, formatPercentage, calculateRiskTier } from "@/lib/utils";

const DRUG_COLORS = ["#00C9A7", "#3D56F0", "#f59e0b"];

interface DrugEntry {
  drug: string;
  adverseData: AdverseEventSummary | undefined;
  interactionData: { interactions?: DrugFoodInteraction[] } | undefined;
  isLoading: boolean;
}

interface SideBySideMatrixProps {
  drugEntries: DrugEntry[];
}

interface MetricRowProps {
  label: string;
  icon: React.ReactNode;
  values: (string | React.ReactNode)[];
  drugCount: number;
  highlight?: boolean;
}

function MetricRow({ label, icon, values, drugCount, highlight }: MetricRowProps) {
  return (
    <div
      className={cn(
        "grid border-b border-[#1a1a1a] last:border-0",
        highlight && "bg-[#0f0f0f]"
      )}
      style={{ gridTemplateColumns: `200px repeat(${drugCount}, 1fr)` }}
    >
      {/* Label */}
      <div className="flex items-center gap-2 px-4 py-3 border-r border-[#1a1a1a]">
        <span className="text-[#555555] shrink-0">{icon}</span>
        <span className="text-[10px] text-[#666666] uppercase tracking-wide font-semibold">{label}</span>
      </div>
      {/* Values */}
      {values.map((val, i) => (
        <div
          key={i}
          className={cn(
            "px-4 py-3 flex items-center justify-center border-r border-[#1a1a1a] last:border-0",
          )}
        >
          <span className="text-sm text-white text-center">{val ?? "—"}</span>
        </div>
      ))}
    </div>
  );
}

export function SideBySideMatrix({ drugEntries }: SideBySideMatrixProps) {
  const activeEntries = drugEntries.filter((e) => e.drug);
  const isAnyLoading = drugEntries.some((e) => e.isLoading);
  const drugCount = activeEntries.length;

  const metrics = useMemo(() => {
    if (drugCount === 0) return null;

    return activeEntries.map(({ drug, adverseData, interactionData }) => {
      const total = adverseData?.totalReports ?? 0;
      const serious = adverseData?.seriousReports ?? 0;
      const deaths = adverseData?.deathReports ?? 0;
      const hosp = adverseData?.hospitalizationReports ?? 0;
      const seriousPct = total > 0 ? (serious / total) * 100 : 0;
      const fatalityPct = total > 0 ? (deaths / total) * 100 : 0;
      const hospPct = total > 0 ? (hosp / total) * 100 : 0;

      const topReactions = Array.isArray(adverseData?.topReactions)
        ? adverseData!.topReactions.slice(0, 5)
        : [];

      const interactions = Array.isArray(interactionData?.interactions)
        ? interactionData!.interactions
        : [];

      const criticalInteractions = interactions.filter((i) => i.riskTier === "critical").length;
      const highInteractions = interactions.filter((i) => i.riskTier === "high").length;

      const riskTier = calculateRiskTier(total);

      return {
        drug,
        total,
        serious,
        seriousPct,
        deaths,
        fatalityPct,
        hosp,
        hospPct,
        topReactions,
        criticalInteractions,
        highInteractions,
        totalInteractions: interactions.length,
        riskTier,
      };
    });
  }, [activeEntries, drugCount]);

  if (isAnyLoading) {
    return (
      <div className="bg-[#111111] border border-[#222222]">
        <div className="px-5 py-4 border-b border-[#222222]">
          <h2 className="text-xs font-semibold uppercase tracking-[0.05em] text-[#a1a1a1]">
            Side-by-Side Metrics
          </h2>
        </div>
        <LoadingState message="Loading comparison data..." className="py-16" />
      </div>
    );
  }

  if (drugCount === 0 || !metrics) {
    return (
      <div className="bg-[#111111] border border-[#222222]">
        <div className="px-5 py-4 border-b border-[#222222]">
          <h2 className="text-xs font-semibold uppercase tracking-[0.05em] text-[#a1a1a1]">
            Side-by-Side Metrics
          </h2>
        </div>
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-sm text-[#555555]">Select drugs above to compare metrics</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#111111] border border-[#222222]">
      <div className="px-5 py-4 border-b border-[#222222]">
        <h2 className="text-xs font-semibold uppercase tracking-[0.05em] text-[#a1a1a1]">
          Side-by-Side Metrics
        </h2>
        <p className="text-[10px] text-[#555555] mt-0.5">
          Key safety metrics compared across selected drugs
        </p>
      </div>

      <div className="overflow-x-auto">
        {/* Column headers */}
        <div
          className="grid border-b border-[#222222] bg-[#0f0f0f]"
          style={{ gridTemplateColumns: `200px repeat(${drugCount}, 1fr)` }}
        >
          <div className="px-4 py-3 border-r border-[#1a1a1a]">
            <span className="text-[9px] uppercase tracking-[0.1em] text-[#444444] font-semibold">
              Metric
            </span>
          </div>
          {metrics.map((m, i) => (
            <div
              key={m.drug}
              className="px-4 py-3 text-center border-r border-[#1a1a1a] last:border-0"
            >
              <span
                className="text-xs font-semibold uppercase tracking-wide capitalize"
                style={{ color: DRUG_COLORS[i] ?? "#a1a1a1" }}
              >
                {m.drug}
              </span>
            </div>
          ))}
        </div>

        {/* Total Reports */}
        <MetricRow
          label="Total Reports"
          icon={<Activity className="w-3.5 h-3.5" />}
          drugCount={drugCount}
          values={metrics.map((m) => (
            <span className="font-semibold text-white">{formatNumber(m.total)}</span>
          ))}
        />

        {/* Risk Tier */}
        <MetricRow
          label="Risk Tier"
          icon={<AlertTriangle className="w-3.5 h-3.5" />}
          drugCount={drugCount}
          highlight
          values={metrics.map((m) => <RiskBadge tier={m.riskTier} />)}
        />

        {/* Serious % */}
        <MetricRow
          label="Serious Events"
          icon={<TrendingUp className="w-3.5 h-3.5" />}
          drugCount={drugCount}
          values={metrics.map((m) => (
            <span className={cn("font-semibold", m.seriousPct >= 50 ? "text-[#ef4444]" : m.seriousPct >= 30 ? "text-[#f59e0b]" : "text-[#22c55e]")}>
              {formatPercentage(m.seriousPct)}
            </span>
          ))}
        />

        {/* Fatality % */}
        <MetricRow
          label="Fatality Rate"
          icon={<Skull className="w-3.5 h-3.5" />}
          drugCount={drugCount}
          highlight
          values={metrics.map((m) => (
            <span className={cn("font-semibold", m.fatalityPct >= 10 ? "text-[#ef4444]" : m.fatalityPct >= 5 ? "text-[#f59e0b]" : "text-[#a1a1a1]")}>
              {formatPercentage(m.fatalityPct)}
            </span>
          ))}
        />

        {/* Hospitalization % */}
        <MetricRow
          label="Hospitalization"
          icon={<Activity className="w-3.5 h-3.5" />}
          drugCount={drugCount}
          values={metrics.map((m) => (
            <span className="text-[#a1a1a1]">{formatPercentage(m.hospPct)}</span>
          ))}
        />

        {/* Food Interaction Signals */}
        <MetricRow
          label="Food Interactions"
          icon={<Salad className="w-3.5 h-3.5" />}
          drugCount={drugCount}
          highlight
          values={metrics.map((m) => (
            <div className="flex flex-col items-center gap-0.5">
              <span className="text-sm font-semibold text-white">{m.totalInteractions}</span>
              <div className="flex items-center gap-1">
                {m.criticalInteractions > 0 && (
                  <span className="text-[9px] bg-[#ef4444]/10 text-[#ef4444] border border-[#ef4444]/20 px-1.5 py-0.5 rounded-[2px] uppercase tracking-wide font-semibold">
                    {m.criticalInteractions} critical
                  </span>
                )}
                {m.highInteractions > 0 && (
                  <span className="text-[9px] bg-[#f59e0b]/10 text-[#f59e0b] border border-[#f59e0b]/20 px-1.5 py-0.5 rounded-[2px] uppercase tracking-wide font-semibold">
                    {m.highInteractions} high
                  </span>
                )}
              </div>
            </div>
          ))}
        />

        {/* Top 5 Reactions */}
        <div
          className="grid border-b border-[#1a1a1a] last:border-0"
          style={{ gridTemplateColumns: `200px repeat(${drugCount}, 1fr)` }}
        >
          <div className="flex items-start gap-2 px-4 py-3 border-r border-[#1a1a1a]">
            <Users className="w-3.5 h-3.5 text-[#555555] mt-0.5 shrink-0" />
            <span className="text-[10px] text-[#666666] uppercase tracking-wide font-semibold">
              Top 5 Reactions
            </span>
          </div>
          {metrics.map((m, i) => (
            <div
              key={m.drug}
              className="px-4 py-3 border-r border-[#1a1a1a] last:border-0"
            >
              {m.topReactions.length > 0 ? (
                <ol className="space-y-1">
                  {m.topReactions.map((r, idx) => (
                    <li key={r.reaction} className="flex items-center gap-2">
                      <span className="text-[9px] text-[#444444] w-3 shrink-0">{idx + 1}.</span>
                      <span className="text-[10px] text-[#a1a1a1] truncate">{r.reaction}</span>
                      <span
                        className="text-[9px] ml-auto shrink-0"
                        style={{ color: DRUG_COLORS[i] ?? "#a1a1a1" }}
                      >
                        {r.percentage != null ? formatPercentage(r.percentage) : ""}
                      </span>
                    </li>
                  ))}
                </ol>
              ) : (
                <span className="text-xs text-[#444444]">No data</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
