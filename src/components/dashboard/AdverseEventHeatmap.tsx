"use client";

import { useMemo } from "react";
import type { HeatmapCell } from "@/lib/types";
import { cn } from "@/lib/utils";

interface AdverseEventHeatmapProps {
  data: HeatmapCell[];
  isLoading?: boolean;
}

function getHeatColor(score: number): string {
  if (score >= 0.85) return "bg-[#ef4444]";
  if (score >= 0.65) return "bg-[#f97316]";
  if (score >= 0.45) return "bg-[#f59e0b]";
  if (score >= 0.25) return "bg-[#3D56F0]";
  if (score >= 0.1) return "bg-[#3D56F0]/50";
  return "bg-[#1a1a1a]";
}

function getHeatOpacity(score: number): string {
  if (score >= 0.85) return "opacity-100";
  if (score >= 0.65) return "opacity-90";
  if (score >= 0.45) return "opacity-80";
  if (score >= 0.25) return "opacity-70";
  if (score >= 0.1) return "opacity-50";
  return "opacity-30";
}

function HeatmapSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="flex gap-1 mb-2">
        <div className="w-24 shrink-0" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex-1 h-4 bg-[#1a1a1a] rounded" />
        ))}
      </div>
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex gap-1 mb-1">
          <div className="w-24 h-8 bg-[#1a1a1a] rounded shrink-0" />
          {Array.from({ length: 5 }).map((_, j) => (
            <div key={j} className="flex-1 h-8 bg-[#1a1a1a] rounded" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function AdverseEventHeatmap({ data, isLoading = false }: AdverseEventHeatmapProps) {
  const { drugs, reactions, matrix } = useMemo(() => {
    if (!Array.isArray(data) || data.length === 0) {
      return { drugs: [], reactions: [], matrix: [] };
    }

    const drugSet = new Set<string>();
    const reactionSet = new Set<string>();
    for (const cell of data) {
      drugSet.add(cell.drug);
      reactionSet.add(cell.reaction);
    }

    const drugs = Array.from(drugSet);
    const reactions = Array.from(reactionSet);

    // Build lookup map
    const lookup = new Map<string, HeatmapCell>();
    for (const cell of data) {
      lookup.set(`${cell.drug}::${cell.reaction}`, cell);
    }

    // Build matrix: rows = drugs, cols = reactions
    const matrix = drugs.map((drug) =>
      reactions.map((reaction) => lookup.get(`${drug}::${reaction}`) ?? null)
    );

    return { drugs, reactions, matrix };
  }, [data]);

  return (
    <div className="bg-[#111111] border border-[#222222] p-5">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-sm font-medium text-white">Reaction Heatmap</h3>
          <p className="text-xs text-[#666666] mt-0.5">Drug × Reaction intensity by report count</p>
        </div>
        {/* Legend */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-[#555555] uppercase tracking-[0.05em]">Low</span>
          <div className="flex gap-0.5">
            {[0.05, 0.2, 0.4, 0.6, 0.8, 1.0].map((score) => (
              <div
                key={score}
                className={cn("w-4 h-4", getHeatColor(score))}
                style={{ opacity: 0.7 + score * 0.3 }}
              />
            ))}
          </div>
          <span className="text-[10px] text-[#555555] uppercase tracking-[0.05em]">High</span>
        </div>
      </div>

      {isLoading && <HeatmapSkeleton />}

      {!isLoading && drugs.length === 0 && (
        <div className="h-48 flex items-center justify-center">
          <p className="text-sm text-[#666666]">No heatmap data available</p>
        </div>
      )}

      {!isLoading && drugs.length > 0 && (
        <div className="overflow-x-auto">
          <div className="min-w-[480px]">
            {/* Column headers (reactions) */}
            <div className="flex gap-1 mb-1 pl-[100px]">
              {reactions.map((reaction) => (
                <div
                  key={reaction}
                  className="flex-1 text-[9px] text-[#555555] uppercase tracking-[0.04em] text-center truncate px-0.5"
                  title={reaction}
                >
                  {reaction.length > 10 ? reaction.slice(0, 9) + "…" : reaction}
                </div>
              ))}
            </div>

            {/* Rows (drugs) */}
            {drugs.map((drug, di) => (
              <div key={drug} className="flex gap-1 mb-1 items-center">
                {/* Row label */}
                <div
                  className="w-[100px] shrink-0 text-[10px] text-[#a1a1a1] truncate pr-2 text-right"
                  title={drug}
                >
                  {drug}
                </div>
                {/* Cells */}
                {matrix[di].map((cell, ri) => (
                  <div
                    key={reactions[ri]}
                    className={cn(
                      "flex-1 h-8 flex items-center justify-center text-[9px] font-medium transition-all duration-150 cursor-default group relative",
                      cell ? getHeatColor(cell.normalizedScore) : "bg-[#0d0d0d]"
                    )}
                    title={cell ? `${drug} × ${reactions[ri]}: ${cell.count.toLocaleString()} reports` : "No data"}
                  >
                    {cell && cell.normalizedScore >= 0.25 && (
                      <span className="text-white/80 text-[8px]">
                        {cell.count >= 1000 ? `${(cell.count / 1000).toFixed(1)}k` : cell.count}
                      </span>
                    )}
                    {/* Tooltip on hover */}
                    {cell && (
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block z-10 pointer-events-none">
                        <div className="bg-[#0a0a0a] border border-[#333333] px-2 py-1 text-[10px] text-white whitespace-nowrap shadow-xl">
                          <span className="text-[#666666]">{drug} × {reactions[ri]}</span>
                          <br />
                          <span className="font-medium">{cell.count.toLocaleString()} reports</span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
