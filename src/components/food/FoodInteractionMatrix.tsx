"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { USDAFood } from "@/lib/types";
import type { ScoredInteraction } from "@/lib/interaction-scoring";
import { LoadingState } from "@/components/ui/LoadingState";
import { ErrorState } from "@/components/ui/ErrorState";
import { cn } from "@/lib/utils";

// ============================================================
// Types
// ============================================================

interface DrugInteractionResponse {
  drug: string;
  interactions: ScoredInteraction[];
}

interface MatrixCell {
  food: string;
  compound: string;
  riskTier: ScoredInteraction["riskTier"] | "none";
  score: number;
  faersSignalCount: number;
  mechanism: string;
}

interface TooltipState {
  cell: MatrixCell;
  x: number;
  y: number;
}

// ============================================================
// Constants
// ============================================================

const RISK_COLORS: Record<string, string> = {
  critical: "#ef4444",
  high: "#f59e0b",
  moderate: "#3D56F0",
  low: "#22c55e",
  minimal: "#1a1a1a",
  none: "#111111",
};

const RISK_BG: Record<string, string> = {
  critical: "bg-[#ef4444]",
  high: "bg-[#f59e0b]",
  moderate: "bg-[#3D56F0]",
  low: "bg-[#22c55e]",
  minimal: "bg-[#1a1a1a]",
  none: "bg-[#111111]",
};

// Foods to show in the matrix rows
const MATRIX_FOODS = [
  { name: "Grapefruit", keywords: ["grapefruit", "pomelo", "seville"] },
  { name: "Spinach", keywords: ["spinach"] },
  { name: "Kale", keywords: ["kale"] },
  { name: "Broccoli", keywords: ["broccoli"] },
  { name: "Aged Cheese", keywords: ["cheese", "cheddar", "parmesan", "brie"] },
  { name: "Red Wine", keywords: ["wine", "grape juice"] },
  { name: "Green Tea", keywords: ["tea", "green tea"] },
  { name: "Banana", keywords: ["banana"] },
  { name: "Avocado", keywords: ["avocado"] },
  { name: "Soy Products", keywords: ["soy", "tofu", "miso", "tempeh"] },
];

// ============================================================
// Helpers
// ============================================================

function foodMatchesCompound(
  foodName: string,
  foodKeywords: string[],
  interaction: ScoredInteraction
): boolean {
  const sources = interaction.foodSources.map((s) => s.toLowerCase());
  return foodKeywords.some((kw) =>
    sources.some((src) => src.includes(kw) || kw.includes(src.split(" ")[0]))
  );
}

function buildMatrix(
  interactions: ScoredInteraction[],
  selectedFood: USDAFood | null
): { rows: typeof MATRIX_FOODS; columns: ScoredInteraction[]; cells: MatrixCell[][] } {
  // Use top interactions as columns (max 8)
  const columns = interactions.slice(0, 8);

  // Determine rows — if a food is selected, highlight it; otherwise use all matrix foods
  const rows = selectedFood
    ? [
        {
          name: selectedFood.description.split(",")[0].trim(),
          keywords: [selectedFood.description.toLowerCase().split(",")[0].trim()],
        },
        ...MATRIX_FOODS.filter(
          (f) =>
            !f.name
              .toLowerCase()
              .includes(selectedFood.description.toLowerCase().split(",")[0].trim())
        ).slice(0, 9),
      ]
    : MATRIX_FOODS;

  const cells: MatrixCell[][] = rows.map((food) =>
    columns.map((interaction) => {
      const matches = foodMatchesCompound(food.name, food.keywords, interaction);
      return {
        food: food.name,
        compound: interaction.compound,
        riskTier: matches ? interaction.riskTier : "none",
        score: matches ? interaction.score : 0,
        faersSignalCount: matches ? interaction.faersSignalCount : 0,
        mechanism: interaction.mechanism,
      };
    })
  );

  return { rows, columns, cells };
}

// ============================================================
// Tooltip
// ============================================================

function MatrixTooltip({ tooltip }: { tooltip: TooltipState }) {
  const { cell, x, y } = tooltip;
  const color = RISK_COLORS[cell.riskTier] ?? RISK_COLORS.none;

  return (
    <div
      className="fixed z-50 pointer-events-none"
      style={{ left: x + 12, top: y - 8 }}
    >
      <div className="bg-[#111111] border border-[#222222] shadow-2xl p-3 w-64">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-white">{cell.food}</span>
          <span
            className="text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-[2px]"
            style={{ color, border: `1px solid ${color}40`, background: `${color}10` }}
          >
            {cell.riskTier === "none" ? "No Interaction" : cell.riskTier}
          </span>
        </div>
        <p className="text-[10px] text-[#00C9A7] font-semibold mb-1">{cell.compound}</p>
        {cell.riskTier !== "none" ? (
          <>
            <p className="text-[10px] text-[#a1a1a1] leading-relaxed line-clamp-3">
              {cell.mechanism}
            </p>
            <div className="flex items-center gap-3 mt-2 pt-2 border-t border-[#1a1a1a]">
              <div>
                <p className="text-[9px] text-[#555555] uppercase tracking-wide">Score</p>
                <p className="text-xs font-bold text-white">{cell.score}</p>
              </div>
              <div>
                <p className="text-[9px] text-[#555555] uppercase tracking-wide">FAERS Signals</p>
                <p className="text-xs font-bold text-white">
                  {cell.faersSignalCount.toLocaleString()}
                </p>
              </div>
            </div>
          </>
        ) : (
          <p className="text-[10px] text-[#555555]">
            No documented interaction between this food and compound.
          </p>
        )}
      </div>
    </div>
  );
}

// ============================================================
// Main Component
// ============================================================

interface FoodInteractionMatrixProps {
  drug: string;
  selectedFood: USDAFood | null;
  className?: string;
}

export function FoodInteractionMatrix({
  drug,
  selectedFood,
  className,
}: FoodInteractionMatrixProps) {
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);

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

  const { rows, columns, cells } = useMemo(() => {
    const interactions = Array.isArray(data?.interactions) ? data.interactions : [];
    return buildMatrix(interactions, selectedFood);
  }, [data, selectedFood]);

  if (!drug) {
    return (
      <div className={cn("bg-[#111111] border border-[#222222] p-6", className)}>
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <p className="text-sm text-[#555555]">Select a drug to view the interaction matrix</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={cn("bg-[#111111] border border-[#222222]", className)}>
        <LoadingState message="Building interaction matrix…" />
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn("bg-[#111111] border border-[#222222]", className)}>
        <ErrorState
          title="Failed to load matrix"
          message={error instanceof Error ? error.message : "Unknown error"}
          onRetry={refetch}
        />
      </div>
    );
  }

  return (
    <div className={cn("bg-[#111111] border border-[#222222]", className)}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-[#222222]">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-[0.05em] text-[#a1a1a1]">
              Food × Compound Interaction Matrix
            </h3>
            <p className="text-xs text-[#555555] mt-0.5">
              {drug.toUpperCase()} — hover cells for details
            </p>
          </div>
          {/* Legend */}
          <div className="flex items-center gap-3 flex-wrap">
            {(["critical", "high", "moderate", "low", "none"] as const).map((tier) => (
              <div key={tier} className="flex items-center gap-1.5">
                <div
                  className="w-3 h-3 rounded-[1px]"
                  style={{ background: RISK_COLORS[tier] }}
                />
                <span className="text-[9px] uppercase tracking-wide text-[#555555]">
                  {tier === "none" ? "None" : tier}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Matrix */}
      <div className="p-4 overflow-x-auto">
        <table className="w-full border-collapse" style={{ minWidth: 600 }}>
          <thead>
            <tr>
              {/* Food label column header */}
              <th className="text-left pb-3 pr-3 w-32">
                <span className="text-[9px] uppercase tracking-[0.08em] text-[#555555]">
                  Food ↓ / Compound →
                </span>
              </th>
              {columns.map((col) => (
                <th key={col.compoundId} className="pb-3 px-1 text-center">
                  <div className="flex flex-col items-center gap-1">
                    <span
                      className="text-[9px] font-semibold uppercase tracking-wide text-[#a1a1a1] whitespace-nowrap"
                      style={{ writingMode: "vertical-rl", transform: "rotate(180deg)", height: 80 }}
                    >
                      {col.compound}
                    </span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((food, rowIdx) => {
              const isSelectedFood =
                selectedFood &&
                food.name.toLowerCase().includes(
                  selectedFood.description.toLowerCase().split(",")[0].trim()
                );
              return (
                <tr
                  key={food.name}
                  className={cn(
                    "border-t border-[#1a1a1a]",
                    isSelectedFood && "bg-[#00C9A7]/5"
                  )}
                >
                  <td className="py-2 pr-3">
                    <span
                      className={cn(
                        "text-xs truncate block max-w-[120px]",
                        isSelectedFood ? "text-[#00C9A7] font-semibold" : "text-[#a1a1a1]"
                      )}
                    >
                      {food.name}
                    </span>
                  </td>
                  {(cells[rowIdx] ?? []).map((cell, colIdx) => {
                    const color = RISK_COLORS[cell.riskTier] ?? RISK_COLORS.none;
                    const hasInteraction = cell.riskTier !== "none";
                    return (
                      <td key={colIdx} className="py-2 px-1 text-center">
                        <div
                          className="w-8 h-8 mx-auto cursor-pointer transition-transform hover:scale-110 flex items-center justify-center"
                          style={{
                            background: hasInteraction ? `${color}20` : "#0f0f0f",
                            border: `1px solid ${hasInteraction ? `${color}40` : "#1a1a1a"}`,
                          }}
                          onMouseEnter={(e) => {
                            const rect = (e.target as HTMLElement).getBoundingClientRect();
                            setTooltip({ cell, x: rect.right, y: rect.top });
                          }}
                          onMouseLeave={() => setTooltip(null)}
                        >
                          {hasInteraction && (
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ background: color }}
                            />
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer stats */}
      <div className="px-6 py-3 border-t border-[#1a1a1a] flex items-center gap-6 flex-wrap">
        {(["critical", "high", "moderate", "low"] as const).map((tier) => {
          const count = cells.flat().filter((c) => c.riskTier === tier).length;
          return count > 0 ? (
            <div key={tier} className="flex items-center gap-1.5">
              <div
                className="w-2 h-2 rounded-full"
                style={{ background: RISK_COLORS[tier] }}
              />
              <span className="text-[10px] text-[#555555]">
                {count} {tier}
              </span>
            </div>
          ) : null;
        })}
        <span className="text-[10px] text-[#444444] ml-auto">
          {rows.length} foods × {columns.length} compounds
        </span>
      </div>

      {/* Tooltip */}
      {tooltip && <MatrixTooltip tooltip={tooltip} />}
    </div>
  );
}
