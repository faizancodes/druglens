"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from "recharts";
import { BarChart2, Radar as RadarIcon } from "lucide-react";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import type { ReactionCount } from "@/lib/types";

interface ReactionBreakdownChartProps {
  reactions: ReactionCount[];
  isLoading?: boolean;
}

// MedDRA System Organ Class color mapping (simplified)
const SOC_COLORS: Record<string, string> = {
  "cardiac disorders": "#ef4444",
  "nervous system disorders": "#3D56F0",
  "gastrointestinal disorders": "#f59e0b",
  "skin and subcutaneous tissue disorders": "#a855f7",
  "respiratory, thoracic and mediastinal disorders": "#06b6d4",
  "musculoskeletal and connective tissue disorders": "#84cc16",
  "general disorders and administration site conditions": "#f97316",
  "investigations": "#ec4899",
  "vascular disorders": "#dc2626",
  "infections and infestations": "#16a34a",
  "blood and lymphatic system disorders": "#7c3aed",
  "hepatobiliary disorders": "#d97706",
  "renal and urinary disorders": "#0891b2",
  "psychiatric disorders": "#9333ea",
  "metabolism and nutrition disorders": "#65a30d",
  "eye disorders": "#0284c7",
  "immune system disorders": "#c026d3",
  "reproductive system and breast disorders": "#db2777",
  "endocrine disorders": "#ca8a04",
  "injury, poisoning and procedural complications": "#b91c1c",
};

function getReactionColor(reactionName: string, index: number): string {
  const lower = reactionName.toLowerCase();
  for (const [soc, color] of Object.entries(SOC_COLORS)) {
    if (lower.includes(soc.split(" ")[0])) return color;
  }
  // Fallback palette
  const palette = [
    "#00C9A7", "#3D56F0", "#f59e0b", "#ef4444", "#a855f7",
    "#06b6d4", "#84cc16", "#f97316", "#ec4899", "#dc2626",
    "#16a34a", "#7c3aed", "#d97706", "#0891b2", "#9333ea",
  ];
  return palette[index % palette.length];
}

interface TooltipPayloadItem {
  name: string;
  value: number;
  payload: { reaction: string; count: number; percentage: number };
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
}

function CustomBarTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-[#111] border border-[#333] p-3 text-xs shadow-xl max-w-[200px]">
      <div className="text-white font-medium mb-1 leading-snug">{d.reaction}</div>
      <div className="text-[#a1a1a1]">
        {d.count.toLocaleString()} reports
      </div>
      <div className="text-[#666]">{d.percentage.toFixed(1)}% of total</div>
    </div>
  );
}

function SkeletonChart() {
  return (
    <div className="animate-pulse space-y-3">
      <div className="h-4 w-48 bg-[#1a1a1a] rounded" />
      <div className="h-64 bg-[#111] border border-[#1a1a1a]" />
    </div>
  );
}

type ChartMode = "bar" | "radar";

export function ReactionBreakdownChart({
  reactions,
  isLoading = false,
}: ReactionBreakdownChartProps) {
  const [mode, setMode] = useState<ChartMode>("bar");

  const top15 = useMemo(() => {
    if (!Array.isArray(reactions) || reactions.length === 0) return [];
    const sorted = [...reactions].sort((a, b) => b.count - a.count).slice(0, 15);
    const total = sorted.reduce((sum, r) => sum + r.count, 0);
    return sorted.map((r, i) => ({
      reaction: r.reaction,
      shortName:
        r.reaction.length > 22
          ? r.reaction.slice(0, 20) + "…"
          : r.reaction,
      count: r.count,
      percentage: total > 0 ? (r.count / total) * 100 : 0,
      color: getReactionColor(r.reaction, i),
    }));
  }, [reactions]);

  if (isLoading) return <SkeletonChart />;

  const isEmpty = top15.length === 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.15 }}
    >
      <Card>
        <CardHeader
          title="Reaction Breakdown"
          subtitle="Top 15 adverse reactions by frequency"
          actions={
            <div className="flex items-center border border-[#222]">
              <button
                onClick={() => setMode("bar")}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-[10px] uppercase tracking-wider transition-colors ${
                  mode === "bar"
                    ? "bg-[#00C9A7] text-[#0a0a0a] font-bold"
                    : "text-[#555] hover:text-[#a1a1a1]"
                }`}
              >
                <BarChart2 className="w-3 h-3" />
                Bar
              </button>
              <button
                onClick={() => setMode("radar")}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-[10px] uppercase tracking-wider transition-colors ${
                  mode === "radar"
                    ? "bg-[#00C9A7] text-[#0a0a0a] font-bold"
                    : "text-[#555] hover:text-[#a1a1a1]"
                }`}
              >
                <RadarIcon className="w-3 h-3" />
                Radar
              </button>
            </div>
          }
        />
        <CardBody>
          {isEmpty ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <BarChart2 className="w-8 h-8 text-[#333] mb-3" />
              <p className="text-sm text-[#555]">No reaction data available</p>
            </div>
          ) : mode === "bar" ? (
            <ResponsiveContainer width="100%" height={360}>
              <BarChart
                data={top15}
                layout="vertical"
                margin={{ top: 4, right: 24, left: 8, bottom: 4 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#1a1a1a"
                  horizontal={false}
                />
                <XAxis
                  type="number"
                  tick={{ fill: "#555", fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v: number) =>
                    v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)
                  }
                />
                <YAxis
                  type="category"
                  dataKey="shortName"
                  tick={{ fill: "#a1a1a1", fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  width={140}
                />
                <Tooltip content={<CustomBarTooltip />} />
                <Bar dataKey="count" name="Reports" radius={[0, 2, 2, 0]}>
                  {top15.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} fillOpacity={0.85} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <ResponsiveContainer width="100%" height={360}>
              <RadarChart data={top15.slice(0, 10)} cx="50%" cy="50%" outerRadius="75%">
                <PolarGrid stroke="#1a1a1a" />
                <PolarAngleAxis
                  dataKey="shortName"
                  tick={{ fill: "#666", fontSize: 9 }}
                />
                <Radar
                  name="Reports"
                  dataKey="count"
                  stroke="#00C9A7"
                  fill="#00C9A7"
                  fillOpacity={0.15}
                  strokeWidth={1.5}
                />
              </RadarChart>
            </ResponsiveContainer>
          )}

          {/* Legend */}
          {!isEmpty && mode === "bar" && (
            <div className="mt-4 flex flex-wrap gap-2">
              {top15.slice(0, 8).map((r, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <div
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: r.color }}
                  />
                  <span className="text-[10px] text-[#555]">{r.shortName}</span>
                </div>
              ))}
              {top15.length > 8 && (
                <span className="text-[10px] text-[#444]">
                  +{top15.length - 8} more
                </span>
              )}
            </div>
          )}
        </CardBody>
      </Card>
    </motion.div>
  );
}
