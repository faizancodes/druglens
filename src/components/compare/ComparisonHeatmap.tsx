"use client";

import { useMemo } from "react";
import {
  ResponsiveContainer,
  Tooltip,
  Cell,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts";
import type { AdverseEventSummary } from "@/lib/types";
import { cn } from "@/lib/utils";
import { LoadingState } from "@/components/ui/LoadingState";

const DRUG_COLORS = ["#00C9A7", "#3D56F0", "#f59e0b"];

interface DrugData {
  drug: string;
  data: AdverseEventSummary | undefined;
  isLoading: boolean;
}

interface ComparisonHeatmapProps {
  drugDataList: DrugData[];
}

// Normalize a count to 0-100 scale
function normalize(value: number, max: number): number {
  if (max === 0) return 0;
  return Math.round((value / max) * 100);
}

function getHeatColor(value: number): string {
  if (value >= 80) return "#ef4444";
  if (value >= 60) return "#f59e0b";
  if (value >= 40) return "#3D56F0";
  if (value >= 20) return "#00C9A7";
  return "#1a1a1a";
}

interface HeatCell {
  reaction: string;
  drug: string;
  count: number;
  normalized: number;
  color: string;
}

export function ComparisonHeatmap({ drugDataList }: ComparisonHeatmapProps) {
  const activeDrugs = drugDataList.filter((d) => d.drug && !d.isLoading && d.data);
  const isAnyLoading = drugDataList.some((d) => d.isLoading);

  // Collect top reactions across all drugs
  const { reactions, cells } = useMemo(() => {
    if (activeDrugs.length === 0) return { reactions: [], cells: [] };

    // Gather all reactions and their max counts
    const reactionMaxMap = new Map<string, number>();
    for (const { data } of activeDrugs) {
      if (!data?.topReactions || !Array.isArray(data.topReactions)) continue;
      for (const r of data.topReactions) {
        const existing = reactionMaxMap.get(r.reaction) ?? 0;
        reactionMaxMap.set(r.reaction, Math.max(existing, r.count));
      }
    }

    // Pick top 10 reactions by max count
    const topReactions = Array.from(reactionMaxMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([r]) => r);

    // Build cells
    const allCells: HeatCell[] = [];
    for (const { drug, data } of activeDrugs) {
      if (!data?.topReactions || !Array.isArray(data.topReactions)) continue;
      const reactionMap = new Map(data.topReactions.map((r) => [r.reaction, r.count]));
      const maxCount = Math.max(...Array.from(reactionMap.values()), 1);

      for (const reaction of topReactions) {
        const count = reactionMap.get(reaction) ?? 0;
        const norm = normalize(count, maxCount);
        allCells.push({
          reaction,
          drug,
          count,
          normalized: norm,
          color: getHeatColor(norm),
        });
      }
    }

    return { reactions: topReactions, cells: allCells };
  }, [activeDrugs]);

  if (isAnyLoading) {
    return (
      <div className="bg-[#111111] border border-[#222222]">
        <div className="px-5 py-4 border-b border-[#222222]">
          <h2 className="text-xs font-semibold uppercase tracking-[0.05em] text-[#a1a1a1]">
            Reaction Profile Heatmap
          </h2>
        </div>
        <LoadingState message="Loading reaction data..." className="py-16" />
      </div>
    );
  }

  if (activeDrugs.length === 0) {
    return (
      <div className="bg-[#111111] border border-[#222222]">
        <div className="px-5 py-4 border-b border-[#222222]">
          <h2 className="text-xs font-semibold uppercase tracking-[0.05em] text-[#a1a1a1]">
            Reaction Profile Heatmap
          </h2>
        </div>
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-sm text-[#555555]">Select at least one drug to view the heatmap</p>
        </div>
      </div>
    );
  }

  const drugNames = activeDrugs.map((d) => d.drug);

  return (
    <div className="bg-[#111111] border border-[#222222]">
      <div className="px-5 py-4 border-b border-[#222222] flex items-center justify-between">
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-[0.05em] text-[#a1a1a1]">
            Reaction Profile Heatmap
          </h2>
          <p className="text-[10px] text-[#555555] mt-0.5">
            Top 10 adverse reactions — normalized by drug event count
          </p>
        </div>
        {/* Legend */}
        <div className="flex items-center gap-3">
          <span className="text-[9px] uppercase tracking-wide text-[#555555]">Intensity</span>
          <div className="flex items-center gap-1">
            {[
              { color: "#1a1a1a", label: "0" },
              { color: "#00C9A7", label: "20" },
              { color: "#3D56F0", label: "40" },
              { color: "#f59e0b", label: "60" },
              { color: "#ef4444", label: "80+" },
            ].map(({ color, label }) => (
              <div key={label} className="flex items-center gap-0.5">
                <div className="w-3 h-3 border border-[#333333]" style={{ backgroundColor: color }} />
                <span className="text-[8px] text-[#444444]">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="p-5 overflow-x-auto">
        {/* Drug column headers */}
        <div className="flex mb-2" style={{ paddingLeft: "180px" }}>
          {drugNames.map((drug, i) => (
            <div
              key={drug}
              className="flex-1 text-center"
              style={{ minWidth: "80px" }}
            >
              <span
                className="text-[10px] font-semibold uppercase tracking-wide capitalize"
                style={{ color: DRUG_COLORS[i] ?? "#a1a1a1" }}
              >
                {drug}
              </span>
            </div>
          ))}
        </div>

        {/* Grid rows */}
        <div className="space-y-1">
          {reactions.map((reaction) => (
            <div key={reaction} className="flex items-center gap-2">
              {/* Reaction label */}
              <div className="shrink-0 text-right" style={{ width: "172px" }}>
                <span className="text-[10px] text-[#666666] truncate block">{reaction}</span>
              </div>
              {/* Cells */}
              {drugNames.map((drug) => {
                const cell = cells.find((c) => c.drug === drug && c.reaction === reaction);
                const norm = cell?.normalized ?? 0;
                const count = cell?.count ?? 0;
                return (
                  <div
                    key={drug}
                    className="flex-1 group relative"
                    style={{ minWidth: "80px" }}
                  >
                    <div
                      className="h-7 border border-[#1a1a1a] transition-all duration-150 group-hover:border-[#444444] flex items-center justify-center"
                      style={{ backgroundColor: getHeatColor(norm), opacity: norm === 0 ? 0.3 : 1 }}
                    >
                      {count > 0 && (
                        <span className="text-[9px] font-semibold text-white/80">
                          {count >= 1000 ? `${(count / 1000).toFixed(1)}k` : count}
                        </span>
                      )}
                    </div>
                    {/* Tooltip */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 z-10 hidden group-hover:block pointer-events-none">
                      <div className="bg-[#1a1a1a] border border-[#333333] px-2.5 py-1.5 text-[10px] whitespace-nowrap shadow-xl">
                        <p className="text-white font-semibold capitalize">{drug}</p>
                        <p className="text-[#a1a1a1]">{reaction}</p>
                        <p className="text-[#00C9A7]">{count.toLocaleString()} reports</p>
                        <p className="text-[#555555]">Intensity: {norm}/100</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
