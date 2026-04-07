"use client";

import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  ShieldCheck,
  ShieldAlert,
  Shield,
  FlaskConical,
  BookOpen,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useState } from "react";
import type { USDAFood } from "@/lib/types";
import type { ScoredInteraction } from "@/lib/interaction-scoring";
import { RiskBadge } from "@/components/ui/Badge";
import { LoadingState } from "@/components/ui/LoadingState";
import { ErrorState } from "@/components/ui/ErrorState";
import { cn } from "@/lib/utils";

interface DrugInteractionResponse {
  drug: string;
  totalSignals: number;
  criticalCount: number;
  highCount: number;
  moderateCount: number;
  lowCount: number;
  interactions: ScoredInteraction[];
}

interface IngredientRiskScoreCardProps {
  drug: string;
  food: USDAFood | null;
  className?: string;
}

const RISK_TIER_CONFIG = {
  critical: {
    icon: AlertTriangle,
    color: "text-[#ef4444]",
    bg: "bg-[#ef4444]/5",
    border: "border-[#ef4444]/20",
    label: "Critical Risk",
    description: "Avoid this food combination. Serious adverse effects possible.",
  },
  high: {
    icon: ShieldAlert,
    color: "text-[#f59e0b]",
    bg: "bg-[#f59e0b]/5",
    border: "border-[#f59e0b]/20",
    label: "High Risk",
    description: "Significant interaction. Consult prescriber before consuming.",
  },
  moderate: {
    icon: Shield,
    color: "text-[#3D56F0]",
    bg: "bg-[#3D56F0]/5",
    border: "border-[#3D56F0]/20",
    label: "Moderate Risk",
    description: "Monitor closely. Adjust intake if needed.",
  },
  low: {
    icon: ShieldCheck,
    color: "text-[#22c55e]",
    bg: "bg-[#22c55e]/5",
    border: "border-[#22c55e]/20",
    label: "Low Risk",
    description: "Generally safe. Maintain consistent intake.",
  },
  minimal: {
    icon: ShieldCheck,
    color: "text-[#555555]",
    bg: "bg-[#111111]",
    border: "border-[#222222]",
    label: "Minimal Risk",
    description: "No significant interaction expected.",
  },
};

const EVIDENCE_LABELS: Record<string, string> = {
  established: "Established",
  probable: "Probable",
  possible: "Possible",
  theoretical: "Theoretical",
};

const EVIDENCE_COLORS: Record<string, string> = {
  established: "text-[#ef4444]",
  probable: "text-[#f59e0b]",
  possible: "text-[#3D56F0]",
  theoretical: "text-[#555555]",
};

// Determine which interactions are relevant to the selected food
function filterRelevantInteractions(
  interactions: ScoredInteraction[],
  food: USDAFood
): ScoredInteraction[] {
  if (!food) return interactions;
  const desc = food.description.toLowerCase();
  const category = (food.foodCategory ?? "").toLowerCase();

  return interactions.filter((interaction) => {
    const sources = interaction.foodSources.map((s) => s.toLowerCase());
    return sources.some(
      (src) =>
        desc.includes(src) ||
        src.includes(desc.split(",")[0].trim()) ||
        category.includes(src) ||
        src.includes(category.split(" ")[0])
    );
  });
}

function getOverallRiskTier(
  relevant: ScoredInteraction[]
): ScoredInteraction["riskTier"] {
  if (relevant.length === 0) return "minimal";
  const order: ScoredInteraction["riskTier"][] = [
    "critical",
    "high",
    "moderate",
    "low",
    "minimal",
  ];
  for (const tier of order) {
    if (relevant.some((i) => i.riskTier === tier)) return tier;
  }
  return "minimal";
}

function ScoreGauge({ score }: { score: number }) {
  const pct = Math.min(100, Math.max(0, score));
  const color =
    pct >= 80
      ? "#ef4444"
      : pct >= 60
      ? "#f59e0b"
      : pct >= 40
      ? "#3D56F0"
      : pct >= 20
      ? "#22c55e"
      : "#555555";

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-20 h-20">
        <svg viewBox="0 0 80 80" className="w-full h-full -rotate-90">
          <circle
            cx="40"
            cy="40"
            r="32"
            fill="none"
            stroke="#1a1a1a"
            strokeWidth="8"
          />
          <circle
            cx="40"
            cy="40"
            r="32"
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeDasharray={`${(pct / 100) * 201} 201`}
            strokeLinecap="round"
            style={{ transition: "stroke-dasharray 0.6s ease" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-bold text-white leading-none">{Math.round(pct)}</span>
          <span className="text-[9px] text-[#555555] uppercase tracking-wide">score</span>
        </div>
      </div>
    </div>
  );
}

function InteractionRow({ interaction }: { interaction: ScoredInteraction }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border border-[#1a1a1a] bg-[#0f0f0f]">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-[#111111] transition-colors text-left"
      >
        <div className="flex items-center gap-3 min-w-0">
          <RiskBadge tier={interaction.riskTier} />
          <span className="text-sm text-white font-medium truncate">{interaction.compound}</span>
          <span
            className={cn(
              "text-[10px] font-semibold uppercase tracking-wide shrink-0",
              EVIDENCE_COLORS[interaction.evidenceLevel] ?? "text-[#555555]"
            )}
          >
            {EVIDENCE_LABELS[interaction.evidenceLevel]}
          </span>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-xs text-[#555555]">
            {interaction.faersSignalCount.toLocaleString()} FAERS signals
          </span>
          {expanded ? (
            <ChevronUp className="w-3.5 h-3.5 text-[#444444]" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5 text-[#444444]" />
          )}
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 border-t border-[#1a1a1a] space-y-3">
          <div className="pt-3">
            <p className="text-[10px] uppercase tracking-[0.08em] text-[#555555] mb-1">
              Mechanism
            </p>
            <p className="text-xs text-[#a1a1a1] leading-relaxed">{interaction.mechanism}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-[0.08em] text-[#555555] mb-1">
              Food Sources
            </p>
            <div className="flex flex-wrap gap-1">
              {interaction.foodSources.map((src) => (
                <span
                  key={src}
                  className="text-[10px] px-2 py-0.5 bg-[#1a1a1a] border border-[#222222] text-[#a1a1a1] rounded-[2px]"
                >
                  {src}
                </span>
              ))}
            </div>
          </div>
          <div className="bg-[#111111] border border-[#222222] px-3 py-2.5">
            <div className="flex items-start gap-2">
              <BookOpen className="w-3.5 h-3.5 text-[#00C9A7] shrink-0 mt-0.5" />
              <p className="text-xs text-[#a1a1a1] leading-relaxed">
                {interaction.clinicalRecommendation}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function IngredientRiskScoreCard({
  drug,
  food,
  className,
}: IngredientRiskScoreCardProps) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["drug-interactions", drug],
    queryFn: async () => {
      const params = new URLSearchParams({ drug });
      const res = await fetch(`/api/drug-interactions?${params}`);
      if (!res.ok) throw new Error("Failed to load interactions");
      return res.json() as Promise<DrugInteractionResponse>;
    },
    enabled: !!drug,
    staleTime: 5 * 60_000,
  });

  if (!drug) {
    return (
      <div className={cn("bg-[#111111] border border-[#222222] p-6", className)}>
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <FlaskConical className="w-8 h-8 text-[#333333] mb-3" />
          <p className="text-sm text-[#555555]">Select a drug to see interaction scores</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={cn("bg-[#111111] border border-[#222222]", className)}>
        <LoadingState message="Computing interaction scores…" />
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn("bg-[#111111] border border-[#222222]", className)}>
        <ErrorState
          title="Failed to load interactions"
          message={error instanceof Error ? error.message : "Unknown error"}
          onRetry={refetch}
        />
      </div>
    );
  }

  const interactions = Array.isArray(data?.interactions) ? data.interactions : [];
  const relevantInteractions = food
    ? filterRelevantInteractions(interactions, food)
    : interactions;
  const overallTier = getOverallRiskTier(relevantInteractions);
  const config = RISK_TIER_CONFIG[overallTier];
  const IconComponent = config.icon;
  const topScore =
    relevantInteractions.length > 0
      ? Math.max(...relevantInteractions.map((i) => i.score))
      : food
      ? 5
      : 0;

  return (
    <div className={cn("bg-[#111111] border border-[#222222]", className)}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-[#222222]">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-[0.05em] text-[#a1a1a1]">
              Interaction Risk Score
            </h3>
            <p className="text-xs text-[#555555] mt-0.5">
              {drug.toUpperCase()}
              {food ? ` × ${food.description.split(",")[0]}` : " — all compounds"}
            </p>
          </div>
          <RiskBadge tier={overallTier} />
        </div>
      </div>

      {/* Score + summary */}
      <div className={cn("px-6 py-5 border-b border-[#222222]", config.bg, config.border)}>
        <div className="flex items-center gap-6">
          <ScoreGauge score={topScore} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <IconComponent className={cn("w-4 h-4 shrink-0", config.color)} />
              <span className={cn("text-sm font-semibold", config.color)}>{config.label}</span>
            </div>
            <p className="text-xs text-[#a1a1a1] leading-relaxed">{config.description}</p>
            {food && relevantInteractions.length === 0 && (
              <p className="text-xs text-[#555555] mt-2">
                No direct interaction compounds identified for this food-drug pair.
              </p>
            )}
            <div className="flex items-center gap-4 mt-3">
              <div className="text-center">
                <p className="text-lg font-bold text-white leading-none">
                  {relevantInteractions.length}
                </p>
                <p className="text-[9px] uppercase tracking-wide text-[#555555] mt-0.5">
                  Compounds
                </p>
              </div>
              <div className="w-px h-8 bg-[#222222]" />
              <div className="text-center">
                <p className="text-lg font-bold text-white leading-none">
                  {relevantInteractions
                    .reduce((sum, i) => sum + i.faersSignalCount, 0)
                    .toLocaleString()}
                </p>
                <p className="text-[9px] uppercase tracking-wide text-[#555555] mt-0.5">
                  FAERS Signals
                </p>
              </div>
              <div className="w-px h-8 bg-[#222222]" />
              <div className="text-center">
                <p className="text-lg font-bold text-white leading-none">
                  {relevantInteractions.filter((i) => i.evidenceLevel === "established").length}
                </p>
                <p className="text-[9px] uppercase tracking-wide text-[#555555] mt-0.5">
                  Established
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Interaction list */}
      <div className="p-4 space-y-2">
        {relevantInteractions.length === 0 && !food && (
          <p className="text-xs text-[#555555] text-center py-4">
            Select a food to filter relevant interactions
          </p>
        )}
        {relevantInteractions.length === 0 && food && (
          <div className="text-center py-6">
            <ShieldCheck className="w-8 h-8 text-[#22c55e] mx-auto mb-2" />
            <p className="text-sm text-[#a1a1a1]">No known interactions</p>
            <p className="text-xs text-[#555555] mt-1">
              {food.description.split(",")[0]} has no documented interactions with {drug}
            </p>
          </div>
        )}
        {relevantInteractions.map((interaction) => (
          <InteractionRow key={interaction.compoundId} interaction={interaction} />
        ))}
        {!food && interactions.length > 0 && (
          <div className="pt-2 border-t border-[#1a1a1a]">
            <p className="text-[10px] text-[#555555] text-center">
              Showing all {interactions.length} known interaction compounds for {drug}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
