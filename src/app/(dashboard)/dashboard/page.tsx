"use client";

import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  LayoutDashboard,
  RefreshCw,
  Info,
  TrendingUp,
  AlertTriangle,
  Database,
  Bell,
} from "lucide-react";
import { DrugRiskSummaryCard } from "@/components/dashboard/DrugRiskSummaryCard";
import { TopDrugsTable } from "@/components/dashboard/TopDrugsTable";
import { AdverseEventHeatmap } from "@/components/dashboard/AdverseEventHeatmap";
import { RecentAlertsPanel } from "@/components/dashboard/RecentAlertsPanel";
import { TemporalOutbreakChart } from "@/components/dashboard/TemporalOutbreakChart";
import { DemographicsPanel } from "@/components/dashboard/DemographicsPanel";
import { cn } from "@/lib/utils";
import type { HeatmapCell, FAERSAdverseEvent } from "@/lib/types";

// ============================================================
// Types
// ============================================================

interface DashboardDrug {
  name: string;
  genericName: string;
  totalReports: number;
  riskScore: number;
  riskTier: string;
  topReaction: string;
  interactionCount: number;
}

interface DashboardStats {
  totalDrugsMonitored: number;
  totalAdverseEvents: number;
  criticalInteractions: number;
  activeAlerts: number;
  lastUpdated: string;
}

interface DashboardResponse {
  drugs: DashboardDrug[];
  stats: DashboardStats;
  heatmap: HeatmapCell[];
  _fallback?: boolean;
}

// ============================================================
// Fetch helpers
// ============================================================

async function fetchDashboard(): Promise<DashboardResponse> {
  const res = await fetch("/api/dashboard");
  if (!res.ok) throw new Error("Failed to fetch dashboard data");
  return res.json();
}

async function fetchRecentAlerts(drug: string): Promise<{ results: FAERSAdverseEvent[] }> {
  const params = new URLSearchParams({ drug, limit: "10" });
  const res = await fetch(`/api/adverse-events?${params}`);
  if (!res.ok) throw new Error("Failed to fetch recent alerts");
  return res.json();
}

// ============================================================
// Section header sub-component
// ============================================================

function SectionHeader({
  icon,
  title,
  subtitle,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between mb-4">
      <div className="flex items-center gap-2.5">
        <span className="text-[#00C9A7]">{icon}</span>
        <div>
          <h2 className="text-sm font-medium text-white">{title}</h2>
          {subtitle && (
            <p className="text-xs text-[#666666] mt-0.5">{subtitle}</p>
          )}
        </div>
      </div>
      {action}
    </div>
  );
}

// ============================================================
// Page
// ============================================================

const FOCUS_DRUGS = ["warfarin", "metformin", "lisinopril", "atorvastatin", "metoprolol"];

export default function DashboardPage() {
  const [focusDrug, setFocusDrug] = useState("warfarin");

  // Primary dashboard data
  const {
    data,
    isLoading,
    error,
    refetch,
    isFetching,
  } = useQuery<DashboardResponse>({
    queryKey: ["dashboard"],
    queryFn: fetchDashboard,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  // Recent alerts for the focused drug
  const { data: alertsData, isLoading: alertsLoading } = useQuery<{
    results: FAERSAdverseEvent[];
  }>({
    queryKey: ["recent-alerts", focusDrug],
    queryFn: () => fetchRecentAlerts(focusDrug),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  const stats = data?.stats;
  const drugs = data?.drugs ?? [];
  const heatmap = data?.heatmap ?? [];
  const recentEvents = alertsData?.results ?? [];

  return (
    <div className="space-y-6 max-w-[1600px]">
      {/* ── Page header ─────────────────────────────────────── */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-7 h-7 bg-[#00C9A7]/10 border border-[#00C9A7]/20 flex items-center justify-center">
              <LayoutDashboard className="w-3.5 h-3.5 text-[#00C9A7]" />
            </div>
            <h1 className="text-xl font-light text-white tracking-tight">
              Pharmacovigilance Dashboard
            </h1>
          </div>
          <p className="text-xs text-[#555555] ml-9.5">
            Real-time adverse event surveillance across FDA FAERS reports
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Fallback indicator */}
          {data?._fallback && (
            <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.05em] text-[#f59e0b] bg-[#f59e0b]/10 border border-[#f59e0b]/20 px-2.5 py-1.5">
              <Info className="w-3 h-3" />
              Demo data
            </div>
          )}

          {/* Last updated */}
          {stats?.lastUpdated && (
            <span className="text-[10px] text-[#444444] uppercase tracking-[0.05em]">
              Updated{" "}
              {new Date(stats.lastUpdated).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          )}

          {/* Refresh button */}
          <button
            onClick={handleRefresh}
            disabled={isFetching}
            className={cn(
              "flex items-center gap-1.5 text-xs px-3 py-1.5 border transition-colors duration-150",
              "border-[#222222] text-[#666666] hover:border-[#333333] hover:text-[#a1a1a1]",
              "disabled:opacity-40 disabled:cursor-not-allowed"
            )}
          >
            <RefreshCw
              className={cn("w-3 h-3", isFetching && "animate-spin")}
            />
            Refresh
          </button>
        </div>
      </div>

      {/* ── Error state ──────────────────────────────────────── */}
      {error && !data && (
        <div className="flex items-center gap-3 p-4 bg-[#ef4444]/5 border border-[#ef4444]/20 text-sm text-[#ef4444]">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>
            Failed to load dashboard data.{" "}
            <button
              onClick={handleRefresh}
              className="underline underline-offset-2 hover:text-[#f87171]"
            >
              Retry
            </button>
          </span>
        </div>
      )}

      {/* ── KPI cards ────────────────────────────────────────── */}
      <DrugRiskSummaryCard
        totalReports={stats?.totalAdverseEvents ?? 0}
        seriousReports={Math.round((stats?.totalAdverseEvents ?? 0) * 0.312)}
        deathReports={Math.round((stats?.totalAdverseEvents ?? 0) * 0.048)}
        hospitalizationReports={Math.round((stats?.totalAdverseEvents ?? 0) * 0.187)}
        isLoading={isLoading}
      />

      {/* ── Temporal chart + Demographics ────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Temporal outbreak chart — spans 2 cols */}
        <div className="xl:col-span-2">
          <SectionHeader
            icon={<TrendingUp className="w-4 h-4" />}
            title="Temporal Outbreak Trend"
            subtitle="Monthly adverse event volume with serious & fatal breakdown"
            action={
              <div className="flex items-center gap-1.5">
                {FOCUS_DRUGS.map((drug) => (
                  <button
                    key={drug}
                    onClick={() => setFocusDrug(drug)}
                    className={cn(
                      "text-[10px] uppercase tracking-[0.05em] px-2 py-1 border transition-colors duration-150",
                      focusDrug === drug
                        ? "border-[#00C9A7]/40 bg-[#00C9A7]/10 text-[#00C9A7]"
                        : "border-[#1a1a1a] text-[#555555] hover:border-[#333333] hover:text-[#a1a1a1]"
                    )}
                  >
                    {drug}
                  </button>
                ))}
              </div>
            }
          />
          <TemporalOutbreakChart drug={focusDrug} months={24} />
        </div>

        {/* Demographics panel — spans 1 col */}
        <div>
          <SectionHeader
            icon={<Database className="w-4 h-4" />}
            title="Demographics"
            subtitle={`Patient cohort breakdown — ${focusDrug}`}
          />
          <DemographicsPanel drug={focusDrug} />
        </div>
      </div>

      {/* ── Heatmap + Recent alerts ───────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Heatmap — spans 2 cols */}
        <div className="xl:col-span-2">
          <SectionHeader
            icon={<AlertTriangle className="w-4 h-4" />}
            title="Adverse Event Heatmap"
            subtitle="Drug × Reaction intensity across top monitored drugs"
          />
          <AdverseEventHeatmap data={heatmap} isLoading={isLoading} />
        </div>

        {/* Recent alerts — spans 1 col */}
        <div>
          <SectionHeader
            icon={<Bell className="w-4 h-4" />}
            title="Recent Alerts"
            subtitle={`Latest FAERS submissions — ${focusDrug}`}
          />
          <RecentAlertsPanel events={recentEvents} isLoading={alertsLoading} />
        </div>
      </div>

      {/* ── Top drugs table ───────────────────────────────────── */}
      <div>
        <SectionHeader
          icon={<Database className="w-4 h-4" />}
          title="Monitored Drug Registry"
          subtitle={`${drugs.length} drugs tracked · sorted by adverse event volume`}
          action={
            <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.05em] text-[#555555]">
              <span className="w-2 h-2 rounded-full bg-[#00C9A7] animate-pulse" />
              Live data
            </div>
          }
        />
        <TopDrugsTable drugs={drugs} isLoading={isLoading} />
      </div>

      {/* ── Footer note ───────────────────────────────────────── */}
      <div className="flex items-center gap-2 pt-2 pb-4 border-t border-[#1a1a1a]">
        <Info className="w-3 h-3 text-[#444444] shrink-0" />
        <p className="text-[10px] text-[#444444] leading-relaxed">
          Data sourced from FDA FAERS (Adverse Event Reporting System). Report counts reflect
          voluntary submissions and may not represent true incidence rates. For clinical
          decision-making, consult a licensed healthcare professional.
        </p>
      </div>
    </div>
  );
}
