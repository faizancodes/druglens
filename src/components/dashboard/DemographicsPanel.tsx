"use client";

import { useQuery } from "@tanstack/react-query";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { fetchJson } from "@/lib/api";
import { buildQueryString } from "@/lib/utils";
import type { DemographicBreakdown } from "@/lib/types";
import { AlertCircle } from "lucide-react";

interface DemographicsPanelProps {
  drug: string;
}

const SEX_COLORS = ["#3D56F0", "#00C9A7", "#666666"];
const AGE_COLOR = "#3D56F0";

interface PieTooltipProps {
  active?: boolean;
  payload?: Array<{ name: string; value: number; payload: { name: string; value: number } }>;
}

function PieTooltipContent({ active, payload }: PieTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  const item = payload[0];
  return (
    <div className="bg-[#111111] border border-[#222222] px-3 py-2 text-xs shadow-xl">
      <p className="text-white font-medium">{item.name}</p>
      <p className="text-[#a1a1a1]">{item.value.toLocaleString()} reports</p>
    </div>
  );
}

interface BarTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
}

function BarTooltipContent({ active, payload, label }: BarTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="bg-[#111111] border border-[#222222] px-3 py-2 text-xs shadow-xl">
      <p className="text-[#a1a1a1] mb-1">{label}</p>
      <p className="text-white font-medium">{(payload[0]?.value ?? 0).toLocaleString()} reports</p>
    </div>
  );
}

function DemographicsSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-4 w-32 bg-[#1a1a1a] rounded" />
      <div className="flex gap-4">
        <div className="flex-1 h-40 bg-[#1a1a1a] rounded" />
        <div className="flex-1 h-40 bg-[#1a1a1a] rounded" />
      </div>
    </div>
  );
}

export function DemographicsPanel({ drug }: DemographicsPanelProps) {
  const { data, isLoading, error, refetch } = useQuery<DemographicBreakdown>({
    queryKey: ["demographics", drug],
    queryFn: async () => {
      const qs = buildQueryString({ drug });
      return fetchJson<DemographicBreakdown>(`/api/adverse-events/demographics?${qs}`);
    },
    enabled: !!drug,
    staleTime: 10 * 60 * 1000,
  });

  const sexData = data?.bySex
    ? [
        { name: "Male", value: data.bySex.male },
        { name: "Female", value: data.bySex.female },
        { name: "Unknown", value: data.bySex.unknown },
      ].filter((d) => d.value > 0)
    : [];

  const ageData = Array.isArray(data?.byAgeGroup)
    ? data.byAgeGroup.map((ag) => ({
        name: ag.ageGroup,
        count: ag.count,
        pct: ag.percentage,
      }))
    : [];

  return (
    <div className="bg-[#111111] border border-[#222222] p-5">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-sm font-medium text-white">Demographics</h3>
          <p className="text-xs text-[#666666] mt-0.5">Patient distribution by sex & age</p>
        </div>
        {error && (
          <button onClick={() => refetch()} className="text-xs text-[#3D56F0] hover:underline flex items-center gap-1">
            <AlertCircle className="w-3 h-3" /> Retry
          </button>
        )}
      </div>

      {isLoading && <DemographicsSkeleton />}

      {error && !isLoading && (
        <div className="h-48 flex items-center justify-center">
          <div className="text-center">
            <AlertCircle className="w-8 h-8 text-[#ef4444] mx-auto mb-2" />
            <p className="text-sm text-[#ef4444]">Failed to load demographics</p>
            <button onClick={() => refetch()} className="mt-2 text-xs text-[#3D56F0] hover:underline">
              Try again
            </button>
          </div>
        </div>
      )}

      {!isLoading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Sex Distribution Pie */}
          <div>
            <p className="text-[10px] text-[#555555] uppercase tracking-[0.05em] mb-3">By Sex</p>
            {sexData.length === 0 ? (
              <div className="h-40 flex items-center justify-center">
                <p className="text-xs text-[#555555]">No sex data available</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie
                    data={sexData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={65}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {sexData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={SEX_COLORS[index % SEX_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<PieTooltipContent />} />
                  <Legend
                    wrapperStyle={{ fontSize: "10px", color: "#666666" }}
                    iconType="circle"
                    iconSize={6}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Age Distribution Bar */}
          <div>
            <p className="text-[10px] text-[#555555] uppercase tracking-[0.05em] mb-3">By Age Group</p>
            {ageData.length === 0 ? (
              <div className="h-40 flex items-center justify-center">
                <p className="text-xs text-[#555555]">No age data available</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={ageData} margin={{ top: 0, right: 0, left: -28, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" vertical={false} />
                  <XAxis
                    dataKey="name"
                    tick={{ fill: "#555555", fontSize: 9 }}
                    axisLine={{ stroke: "#222222" }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: "#555555", fontSize: 9 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v: number) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)}
                  />
                  <Tooltip content={<BarTooltipContent />} />
                  <Bar dataKey="count" fill={AGE_COLOR} radius={[2, 2, 0, 0]} maxBarSize={32} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      )}

      {/* Outcome breakdown */}
      {!isLoading && !error && Array.isArray(data?.byOutcome) && data.byOutcome.length > 0 && (
        <div className="mt-5 pt-4 border-t border-[#1a1a1a]">
          <p className="text-[10px] text-[#555555] uppercase tracking-[0.05em] mb-3">By Outcome</p>
          <div className="grid grid-cols-2 gap-2">
            {data.byOutcome.slice(0, 6).map((outcome) => (
              <div key={outcome.outcome} className="flex items-center justify-between py-1.5 px-2 bg-[#0d0d0d]">
                <span className="text-[10px] text-[#a1a1a1] truncate">{outcome.outcome}</span>
                <span className="text-[10px] text-white font-mono ml-2">{outcome.count.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
