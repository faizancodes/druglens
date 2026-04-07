"use client";

import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Brush,
  Legend,
} from "recharts";
import { fetchJson } from "@/lib/api";
import { buildQueryString } from "@/lib/utils";
import { AlertCircle } from "lucide-react";

interface TimelinePoint {
  date: string;
  month: string;
  label: string;
  count: number;
  seriousCount: number;
  deathCount: number;
  drug: string;
}

interface TemporalOutbreakChartProps {
  drug: string;
  months?: number;
}

const MONTH_OPTIONS = [
  { label: "12 mo", value: 12 },
  { label: "24 mo", value: 24 },
  { label: "36 mo", value: 36 },
  { label: "60 mo", value: 60 },
];

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="bg-[#111111] border border-[#222222] p-3 text-xs shadow-xl">
      <p className="text-[#a1a1a1] mb-2 font-medium">{label}</p>
      {payload.map((entry) => (
        <div key={entry.name} className="flex items-center gap-2 mb-1">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="text-[#666666]">{entry.name}:</span>
          <span className="text-white font-medium">{entry.value.toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
}

export function TemporalOutbreakChart({ drug, months: initialMonths = 24 }: TemporalOutbreakChartProps) {
  const [months, setMonths] = useState(initialMonths);

  const { data, isLoading, error, refetch } = useQuery<TimelinePoint[]>({
    queryKey: ["timeline", drug, months],
    queryFn: async () => {
      const qs = buildQueryString({ drug, months });
      const result = await fetchJson<TimelinePoint[] | { data: TimelinePoint[] }>(`/api/adverse-events/timeline?${qs}`);
      return Array.isArray(result) ? result : (Array.isArray((result as { data: TimelinePoint[] }).data) ? (result as { data: TimelinePoint[] }).data : []);
    },
    enabled: !!drug,
    staleTime: 5 * 60 * 1000,
  });

  const handleMonthChange = useCallback((m: number) => {
    setMonths(m);
  }, []);

  const chartData = Array.isArray(data) ? data : [];

  return (
    <div className="bg-[#111111] border border-[#222222] p-5">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-sm font-medium text-white">Adverse Event Timeline</h3>
          <p className="text-xs text-[#666666] mt-0.5">Monthly FAERS report submissions</p>
        </div>
        <div className="flex items-center gap-1">
          {MONTH_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => handleMonthChange(opt.value)}
              className={`px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.05em] transition-colors ${
                months === opt.value
                  ? "bg-[#3D56F0] text-white"
                  : "text-[#666666] hover:text-white hover:bg-[#1a1a1a]"
              }`}
            >
              {opt.label}
            </button>
          ))}
          <button
            onClick={() => refetch()}
            className="ml-2 p-1 text-[#666666] hover:text-white transition-colors"
            title="Refresh"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>

      {isLoading && (
        <div className="h-64 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-6 h-6 border-2 border-[#222] border-t-[#3D56F0] rounded-full animate-spin" />
            <span className="text-xs text-[#666666]">Loading timeline data…</span>
          </div>
        </div>
      )}

      {error && !isLoading && (
        <div className="h-64 flex items-center justify-center">
          <div className="text-center">
            <AlertCircle className="w-8 h-8 text-[#ef4444] mx-auto mb-2" />
            <p className="text-sm text-[#ef4444]">Failed to load timeline</p>
            <button onClick={() => refetch()} className="mt-2 text-xs text-[#3D56F0] hover:underline">
              Try again
            </button>
          </div>
        </div>
      )}

      {!isLoading && !error && chartData.length === 0 && (
        <div className="h-64 flex items-center justify-center">
          <p className="text-sm text-[#666666]">No timeline data available for {drug}</p>
        </div>
      )}

      {!isLoading && !error && chartData.length > 0 && (
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3D56F0" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3D56F0" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorSerious" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorDeath" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fill: "#555555", fontSize: 10 }}
              axisLine={{ stroke: "#222222" }}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fill: "#555555", fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v: number) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: "10px", color: "#666666", paddingTop: "8px" }}
              iconType="circle"
              iconSize={6}
            />
            <Area
              type="monotone"
              dataKey="count"
              name="Total Reports"
              stroke="#3D56F0"
              strokeWidth={1.5}
              fill="url(#colorTotal)"
              dot={false}
              activeDot={{ r: 3, fill: "#3D56F0" }}
            />
            <Area
              type="monotone"
              dataKey="seriousCount"
              name="Serious"
              stroke="#f59e0b"
              strokeWidth={1.5}
              fill="url(#colorSerious)"
              dot={false}
              activeDot={{ r: 3, fill: "#f59e0b" }}
            />
            <Area
              type="monotone"
              dataKey="deathCount"
              name="Deaths"
              stroke="#ef4444"
              strokeWidth={1.5}
              fill="url(#colorDeath)"
              dot={false}
              activeDot={{ r: 3, fill: "#ef4444" }}
            />
            {chartData.length > 12 && (
              <Brush
                dataKey="label"
                height={20}
                stroke="#222222"
                fill="#0a0a0a"
                travellerWidth={6}
                startIndex={Math.max(0, chartData.length - 12)}
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
