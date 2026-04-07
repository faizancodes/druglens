"use client";

import { useQuery } from "@tanstack/react-query";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import type { USDAFood } from "@/lib/types";
import { LoadingState } from "@/components/ui/LoadingState";
import { ErrorState } from "@/components/ui/ErrorState";
import { cn } from "@/lib/utils";

// Interaction-relevant nutrients to display on the radar
const RADAR_NUTRIENTS = [
  { id: 1185, name: "Vitamin K", unit: "µg", maxRef: 500, interactionRelevant: true },
  { id: 1162, name: "Vitamin C", unit: "mg", maxRef: 90, interactionRelevant: false },
  { id: 1092, name: "Potassium", unit: "mg", maxRef: 4700, interactionRelevant: true },
  { id: 1087, name: "Calcium", unit: "mg", maxRef: 1300, interactionRelevant: false },
  { id: 1089, name: "Iron", unit: "mg", maxRef: 18, interactionRelevant: false },
  { id: 1090, name: "Magnesium", unit: "mg", maxRef: 420, interactionRelevant: false },
  { id: 1003, name: "Protein", unit: "g", maxRef: 50, interactionRelevant: false },
  { id: 1079, name: "Fiber", unit: "g", maxRef: 28, interactionRelevant: false },
];

// Nutrients that are interaction-relevant get highlighted
const INTERACTION_NUTRIENT_IDS = new Set([1185, 1092]);

interface NutrientDetailResponse {
  fdcId: number;
  description: string;
  foodCategory?: { description: string };
  foodNutrients: Array<{
    id: number;
    amount: number;
    nutrient: {
      id: number;
      number: string;
      name: string;
      rank: number;
      unitName: string;
    };
  }>;
  interactionFlags?: Array<{
    compound: string;
    present: boolean;
    riskTier: string;
    notes: string;
  }>;
}

interface RadarDataPoint {
  nutrient: string;
  value: number;
  fullMark: number;
  rawAmount: number;
  unit: string;
  isInteractionRelevant: boolean;
}

interface NutrientProfileChartProps {
  food: USDAFood | null;
  className?: string;
}

// Custom tooltip for the radar chart
function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: RadarDataPoint }>;
}) {
  if (!active || !payload || payload.length === 0) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-[#111111] border border-[#222222] px-3 py-2 shadow-xl">
      <p className="text-xs font-semibold text-white">{d.nutrient}</p>
      <p className="text-xs text-[#a1a1a1] mt-0.5">
        {d.rawAmount.toFixed(1)} {d.unit}
      </p>
      <p className="text-[10px] text-[#555555]">
        {d.value.toFixed(0)}% of reference
      </p>
      {d.isInteractionRelevant && (
        <p className="text-[10px] text-[#f59e0b] mt-1">⚠ Interaction-relevant</p>
      )}
    </div>
  );
}

// Custom angle axis tick
function CustomTick({
  x,
  y,
  payload,
  radarData,
  ...rest
}: {
  x?: number;
  y?: number;
  payload?: { value: string };
  radarData: RadarDataPoint[];
  [key: string]: unknown;
}) {
  void rest;
  if (!payload || x == null || y == null) return null;
  const point = radarData.find((d) => d.nutrient === payload.value);
  const isRelevant = point?.isInteractionRelevant ?? false;

  return (
    <text
      x={x}
      y={y}
      textAnchor="middle"
      dominantBaseline="central"
      className="text-[10px]"
      fill={isRelevant ? "#f59e0b" : "#666666"}
      fontSize={10}
      fontWeight={isRelevant ? 600 : 400}
    >
      {payload.value}
    </text>
  );
}

export function NutrientProfileChart({ food, className }: NutrientProfileChartProps) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["food-nutrients", food?.fdcId],
    queryFn: async () => {
      const params = new URLSearchParams({ fdcId: String(food!.fdcId) });
      const res = await fetch(`/api/food-data/nutrients?${params}`);
      if (!res.ok) throw new Error("Failed to load nutrient data");
      return res.json() as Promise<NutrientDetailResponse>;
    },
    enabled: !!food?.fdcId,
    staleTime: 10 * 60_000,
  });

  if (!food) {
    return (
      <div className={cn("bg-[#111111] border border-[#222222] p-6", className)}>
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <div className="w-10 h-10 bg-[#0f0f0f] border border-[#222222] flex items-center justify-center mb-3">
            <span className="text-lg">🥗</span>
          </div>
          <p className="text-sm text-[#555555]">Select a food to view nutrient profile</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={cn("bg-[#111111] border border-[#222222]", className)}>
        <LoadingState message="Loading nutrient data…" />
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn("bg-[#111111] border border-[#222222]", className)}>
        <ErrorState
          title="Failed to load nutrients"
          message={error instanceof Error ? error.message : "Unknown error"}
          onRetry={refetch}
        />
      </div>
    );
  }

  // Build radar data from nutrient response
  const nutrientMap = new Map<number, number>();
  if (Array.isArray(data?.foodNutrients)) {
    for (const fn of data.foodNutrients) {
      if (fn?.nutrient?.id != null) {
        nutrientMap.set(fn.nutrient.id, fn.amount ?? 0);
      }
    }
  }

  const radarData: RadarDataPoint[] = RADAR_NUTRIENTS.map((n) => {
    const amount = nutrientMap.get(n.id) ?? 0;
    const pct = Math.min(100, (amount / n.maxRef) * 100);
    return {
      nutrient: n.name,
      value: pct,
      fullMark: 100,
      rawAmount: amount,
      unit: n.unit,
      isInteractionRelevant: INTERACTION_NUTRIENT_IDS.has(n.id),
    };
  });

  const interactionFlags = Array.isArray(data?.interactionFlags)
    ? data.interactionFlags.filter((f) => f.present)
    : [];

  // Top nutrients by amount
  const topNutrients = radarData
    .filter((d) => d.rawAmount > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  return (
    <div className={cn("bg-[#111111] border border-[#222222]", className)}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-[#222222]">
        <h3 className="text-xs font-semibold uppercase tracking-[0.05em] text-[#a1a1a1]">
          Nutrient Profile
        </h3>
        <p className="text-xs text-[#555555] mt-0.5 truncate">{food.description}</p>
      </div>

      {/* Radar chart */}
      <div className="px-4 pt-4 pb-2">
        <ResponsiveContainer width="100%" height={240}>
          <RadarChart data={radarData} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
            <PolarGrid stroke="#1a1a1a" />
            <PolarAngleAxis
              dataKey="nutrient"
              tick={(props) => <CustomTick {...props} radarData={radarData} />}
            />
            <Radar
              name="Nutrients"
              dataKey="value"
              stroke="#00C9A7"
              fill="#00C9A7"
              fillOpacity={0.15}
              strokeWidth={1.5}
            />
            <Tooltip content={<CustomTooltip />} />
          </RadarChart>
        </ResponsiveContainer>
        <p className="text-[9px] text-[#444444] text-center mt-1">
          Values as % of daily reference intake · <span className="text-[#f59e0b]">Yellow</span> = interaction-relevant
        </p>
      </div>

      {/* Top nutrients table */}
      {topNutrients.length > 0 && (
        <div className="px-4 pb-4">
          <p className="text-[9px] uppercase tracking-[0.08em] text-[#555555] mb-2">
            Key Nutrients (per 100g)
          </p>
          <div className="space-y-1.5">
            {topNutrients.map((n) => (
              <div key={n.nutrient} className="flex items-center gap-3">
                <div className="w-24 shrink-0">
                  <span
                    className={cn(
                      "text-[10px] font-medium",
                      n.isInteractionRelevant ? "text-[#f59e0b]" : "text-[#a1a1a1]"
                    )}
                  >
                    {n.nutrient}
                  </span>
                </div>
                <div className="flex-1 h-1.5 bg-[#1a1a1a] rounded-full overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-500",
                      n.isInteractionRelevant ? "bg-[#f59e0b]" : "bg-[#00C9A7]"
                    )}
                    style={{ width: `${n.value}%` }}
                  />
                </div>
                <div className="w-20 text-right shrink-0">
                  <span className="text-[10px] text-[#666666]">
                    {n.rawAmount.toFixed(1)} {n.unit}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Interaction flags */}
      {interactionFlags.length > 0 && (
        <div className="px-4 pb-4 border-t border-[#1a1a1a] pt-4">
          <p className="text-[9px] uppercase tracking-[0.08em] text-[#555555] mb-2">
            Interaction Flags
          </p>
          <div className="space-y-2">
            {interactionFlags.map((flag) => (
              <div
                key={flag.compound}
                className="flex items-start gap-2 bg-[#0f0f0f] border border-[#222222] px-3 py-2"
              >
                <span className="text-[#f59e0b] text-xs shrink-0">⚠</span>
                <div>
                  <p className="text-xs font-semibold text-white">{flag.compound}</p>
                  <p className="text-[10px] text-[#666666] mt-0.5">{flag.notes}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
