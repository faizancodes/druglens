"use client";

import { cn } from "@/lib/utils";
import { formatNumber } from "@/lib/utils";
import { TrendingUp, AlertTriangle, Skull, Activity } from "lucide-react";

interface KpiCardProps {
  label: string;
  value: string | number;
  subValue?: string;
  icon: React.ReactNode;
  iconBg: string;
  trend?: { value: number; label: string };
  isLoading?: boolean;
}

function KpiCard({ label, value, subValue, icon, iconBg, trend, isLoading }: KpiCardProps) {
  if (isLoading) {
    return (
      <div className="bg-[#111111] border border-[#222222] p-5 animate-pulse">
        <div className="flex items-start justify-between mb-4">
          <div className="w-9 h-9 bg-[#1a1a1a] rounded" />
          <div className="w-16 h-4 bg-[#1a1a1a] rounded" />
        </div>
        <div className="w-24 h-7 bg-[#1a1a1a] rounded mb-1" />
        <div className="w-32 h-3 bg-[#1a1a1a] rounded" />
      </div>
    );
  }

  return (
    <div className="bg-[#111111] border border-[#222222] p-5 hover:border-[#333333] transition-colors duration-150">
      <div className="flex items-start justify-between mb-4">
        <div className={cn("w-9 h-9 flex items-center justify-center rounded", iconBg)}>
          {icon}
        </div>
        {trend && (
          <span
            className={cn(
              "text-[10px] font-semibold uppercase tracking-[0.05em] px-1.5 py-0.5 rounded",
              trend.value >= 0
                ? "text-[#ef4444] bg-[#ef4444]/10"
                : "text-[#22c55e] bg-[#22c55e]/10"
            )}
          >
            {trend.value >= 0 ? "+" : ""}{trend.value}% {trend.label}
          </span>
        )}
      </div>
      <div className="text-2xl font-light text-white tracking-tight mb-0.5">
        {typeof value === "number" ? formatNumber(value) : value}
      </div>
      <div className="text-xs text-[#666666] uppercase tracking-[0.05em]">{label}</div>
      {subValue && (
        <div className="text-xs text-[#a1a1a1] mt-1">{subValue}</div>
      )}
    </div>
  );
}

interface DrugRiskSummaryCardProps {
  totalReports: number;
  seriousReports: number;
  deathReports: number;
  hospitalizationReports: number;
  isLoading?: boolean;
}

export function DrugRiskSummaryCard({
  totalReports,
  seriousReports,
  deathReports,
  hospitalizationReports,
  isLoading = false,
}: DrugRiskSummaryCardProps) {
  const seriousPct = totalReports > 0 ? ((seriousReports / totalReports) * 100).toFixed(1) : "0.0";
  const fatalityPct = totalReports > 0 ? ((deathReports / totalReports) * 100).toFixed(2) : "0.00";
  const hospPct = totalReports > 0 ? ((hospitalizationReports / totalReports) * 100).toFixed(1) : "0.0";

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <KpiCard
        label="Total Reports"
        value={totalReports}
        subValue="FAERS submissions"
        icon={<Activity className="w-4 h-4 text-[#3D56F0]" />}
        iconBg="bg-[#3D56F0]/10"
        trend={{ value: 8.2, label: "YoY" }}
        isLoading={isLoading}
      />
      <KpiCard
        label="Serious Events"
        value={`${seriousPct}%`}
        subValue={`${formatNumber(seriousReports)} reports`}
        icon={<AlertTriangle className="w-4 h-4 text-[#f59e0b]" />}
        iconBg="bg-[#f59e0b]/10"
        trend={{ value: 3.1, label: "YoY" }}
        isLoading={isLoading}
      />
      <KpiCard
        label="Fatality Rate"
        value={`${fatalityPct}%`}
        subValue={`${formatNumber(deathReports)} deaths`}
        icon={<Skull className="w-4 h-4 text-[#ef4444]" />}
        iconBg="bg-[#ef4444]/10"
        trend={{ value: -1.4, label: "YoY" }}
        isLoading={isLoading}
      />
      <KpiCard
        label="Hospitalizations"
        value={`${hospPct}%`}
        subValue={`${formatNumber(hospitalizationReports)} cases`}
        icon={<TrendingUp className="w-4 h-4 text-[#00C9A7]" />}
        iconBg="bg-[#00C9A7]/10"
        trend={{ value: 2.7, label: "YoY" }}
        isLoading={isLoading}
      />
    </div>
  );
}
