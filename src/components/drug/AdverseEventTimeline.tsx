"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { format, parse } from "date-fns";
import { Activity } from "lucide-react";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import type { TimelineDataPoint } from "@/lib/types";

interface AdverseEventTimelineProps {
  data: TimelineDataPoint[];
  isLoading?: boolean;
  onPointClick?: (point: TimelineDataPoint) => void;
}

interface ChartDataPoint {
  month: string;
  label: string;
  total: number;
  serious: number;
  nonSerious: number;
  raw: TimelineDataPoint;
}

interface TooltipPayloadItem {
  name: string;
  value: number;
  color: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="bg-[#111] border border-[#333] p-3 text-xs space-y-1.5 shadow-xl">
      <div className="text-[#a1a1a1] font-semibold uppercase tracking-wider mb-2">
        {label}
      </div>
      {payload.map((entry) => (
        <div key={entry.name} className="flex items-center justify-between gap-6">
          <div className="flex items-center gap-1.5">
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-[#666]">{entry.name}</span>
          </div>
          <span className="text-white font-medium">
            {entry.value.toLocaleString()}
          </span>
        </div>
      ))}
    </div>
  );
}

function TimelineSkeleton() {
  return (
    <div className="animate-pulse space-y-3">
      <div className="h-4 w-40 bg-[#1a1a1a] rounded" />
      <div className="h-64 bg-[#111] border border-[#1a1a1a]" />
    </div>
  );
}

export function AdverseEventTimeline({
  data,
  isLoading = false,
  onPointClick,
}: AdverseEventTimelineProps) {
  const chartData = useMemo<ChartDataPoint[]>(() => {
    if (!Array.isArray(data) || data.length === 0) return [];

    return data
      .map((point) => {
        let label = point.month;
        try {
          const parsed = parse(point.month, "yyyy-MM", new Date());
          label = format(parsed, "MMM yy");
        } catch {
          // keep raw month string
        }

        const total = point.count ?? 0;
        const serious = point.seriousCount ?? 0;
        const nonSerious = Math.max(0, total - serious);

        return {
          month: point.month,
          label,
          total,
          serious,
          nonSerious,
          raw: point,
        };
      })
      .sort((a, b) => a.month.localeCompare(b.month));
  }, [data]);

  if (isLoading) return <TimelineSkeleton />;

  const isEmpty = chartData.length === 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.1 }}
    >
      <Card>
        <CardHeader
          title="Adverse Event Timeline"
          subtitle="Monthly report counts — serious vs. non-serious"
          actions={
            <div className="flex items-center gap-1.5 text-[10px] text-[#555] uppercase tracking-wider">
              <Activity className="w-3.5 h-3.5" />
              FAERS Reports
            </div>
          }
        />
        <CardBody>
          {isEmpty ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Activity className="w-8 h-8 text-[#333] mb-3" />
              <p className="text-sm text-[#555]">No timeline data available</p>
              <p className="text-xs text-[#444] mt-1">
                Try adjusting the date range or drug name
              </p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart
                data={chartData}
                margin={{ top: 8, right: 16, left: 0, bottom: 0 }}
                onClick={(e) => {
                  if (e?.activePayload?.[0] && onPointClick) {
                    const point = (e.activePayload[0].payload as ChartDataPoint).raw;
                    onPointClick(point);
                  }
                }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#1a1a1a"
                  vertical={false}
                />
                <XAxis
                  dataKey="label"
                  tick={{ fill: "#555", fontSize: 10 }}
                  axisLine={{ stroke: "#222" }}
                  tickLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tick={{ fill: "#555", fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  width={48}
                  tickFormatter={(v: number) =>
                    v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)
                  }
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  wrapperStyle={{ fontSize: 10, color: "#666" }}
                  iconType="circle"
                  iconSize={8}
                />
                <Bar
                  dataKey="nonSerious"
                  name="Non-Serious"
                  stackId="a"
                  fill="#1a3a2a"
                  stroke="#00C9A7"
                  strokeWidth={0}
                  cursor="pointer"
                />
                <Bar
                  dataKey="serious"
                  name="Serious"
                  stackId="a"
                  fill="#3a1a1a"
                  stroke="#ef4444"
                  strokeWidth={0}
                  cursor="pointer"
                />
                <Line
                  type="monotone"
                  dataKey="total"
                  name="Total"
                  stroke="#00C9A7"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, fill: "#00C9A7", stroke: "#0a0a0a", strokeWidth: 2 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          )}
        </CardBody>
      </Card>
    </motion.div>
  );
}
