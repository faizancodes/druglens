"use client";

import { useMemo } from "react";
import { formatFAERSDate } from "@/lib/utils";
import type { FAERSAdverseEvent } from "@/lib/types";
import { AlertTriangle, Skull, Hospital, Zap, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface RecentAlertsPanelProps {
  events: FAERSAdverseEvent[];
  isLoading?: boolean;
}

interface AlertItem {
  id: string;
  date: string;
  drug: string;
  reaction: string;
  outcome: string;
  country: string;
  isFatal: boolean;
  isHospitalization: boolean;
  isLifeThreatening: boolean;
  isSerious: boolean;
}

function parseAlerts(events: FAERSAdverseEvent[]): AlertItem[] {
  if (!Array.isArray(events)) return [];
  return events.map((e) => {
    const reactions = Array.isArray(e.patient?.reaction) ? e.patient.reaction : [];
    const drugs = Array.isArray(e.patient?.drug) ? e.patient.drug : [];
    const topReaction = reactions[0]?.reactionmeddrapt ?? "Unknown reaction";
    const topDrug = drugs[0]?.medicinalproduct ?? "Unknown drug";
    const outcome = reactions[0]?.reactionoutcome ?? "0";
    const outcomeLabels: Record<string, string> = {
      "1": "Recovered",
      "2": "Recovering",
      "3": "Not recovered",
      "4": "Recovered with sequelae",
      "5": "Fatal",
      "6": "Unknown",
    };

    return {
      id: e.safetyreportid,
      date: e.receivedate,
      drug: topDrug,
      reaction: topReaction,
      outcome: outcomeLabels[outcome] ?? "Unknown",
      country: e.primarysource?.reportercountry ?? "Unknown",
      isFatal: e.seriousnessdeath === "1",
      isHospitalization: e.seriousnesshospitalization === "1",
      isLifeThreatening: e.seriousnesslifethreatening === "1",
      isSerious: e.serious === "1",
    };
  });
}

function AlertSkeleton() {
  return (
    <div className="animate-pulse space-y-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex gap-3 p-3 bg-[#0d0d0d]">
          <div className="w-6 h-6 bg-[#1a1a1a] rounded-full shrink-0" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3 bg-[#1a1a1a] rounded w-3/4" />
            <div className="h-3 bg-[#1a1a1a] rounded w-1/2" />
          </div>
          <div className="w-16 h-3 bg-[#1a1a1a] rounded" />
        </div>
      ))}
    </div>
  );
}

function SeverityIcon({ alert }: { alert: AlertItem }) {
  if (alert.isFatal) return <Skull className="w-3.5 h-3.5 text-[#ef4444]" />;
  if (alert.isLifeThreatening) return <Zap className="w-3.5 h-3.5 text-[#f97316]" />;
  if (alert.isHospitalization) return <Hospital className="w-3.5 h-3.5 text-[#f59e0b]" />;
  if (alert.isSerious) return <AlertTriangle className="w-3.5 h-3.5 text-[#3D56F0]" />;
  return <Clock className="w-3.5 h-3.5 text-[#555555]" />;
}

function severityBg(alert: AlertItem): string {
  if (alert.isFatal) return "bg-[#ef4444]/10 border-[#ef4444]/20";
  if (alert.isLifeThreatening) return "bg-[#f97316]/10 border-[#f97316]/20";
  if (alert.isHospitalization) return "bg-[#f59e0b]/10 border-[#f59e0b]/20";
  if (alert.isSerious) return "bg-[#3D56F0]/10 border-[#3D56F0]/20";
  return "bg-[#0d0d0d] border-[#1a1a1a]";
}

export function RecentAlertsPanel({ events, isLoading = false }: RecentAlertsPanelProps) {
  const alerts = useMemo(() => parseAlerts(events), [events]);

  return (
    <div className="bg-[#111111] border border-[#222222] flex flex-col h-full">
      <div className="flex items-center justify-between px-5 py-4 border-b border-[#1a1a1a] shrink-0">
        <div>
          <h3 className="text-sm font-medium text-white">Recent FAERS Submissions</h3>
          <p className="text-xs text-[#666666] mt-0.5">
            {isLoading ? "Loading…" : `${alerts.length} recent reports`}
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e] animate-pulse" />
          <span className="text-[10px] text-[#555555] uppercase tracking-[0.05em]">Live</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto max-h-[420px] scrollbar-thin">
        {isLoading && (
          <div className="p-4">
            <AlertSkeleton />
          </div>
        )}

        {!isLoading && alerts.length === 0 && (
          <div className="flex items-center justify-center h-40">
            <p className="text-sm text-[#555555]">No recent alerts</p>
          </div>
        )}

        {!isLoading && alerts.length > 0 && (
          <div className="divide-y divide-[#111111]">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className={cn(
                  "flex items-start gap-3 px-5 py-3.5 border-l-2 hover:bg-[#0d0d0d] transition-colors",
                  severityBg(alert)
                )}
              >
                {/* Icon */}
                <div className="mt-0.5 shrink-0">
                  <SeverityIcon alert={alert} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <span className="text-xs font-medium text-white truncate block">
                        {alert.drug}
                      </span>
                      <span className="text-[10px] text-[#a1a1a1] truncate block mt-0.5">
                        {alert.reaction}
                      </span>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-[10px] text-[#555555] block">
                        {formatFAERSDate(alert.date)}
                      </span>
                      <span className="text-[10px] text-[#444444] block mt-0.5">
                        {alert.country}
                      </span>
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                    {alert.isFatal && (
                      <span className="text-[9px] uppercase tracking-[0.05em] px-1.5 py-0.5 bg-[#ef4444]/20 text-[#ef4444] font-medium">
                        Fatal
                      </span>
                    )}
                    {alert.isLifeThreatening && !alert.isFatal && (
                      <span className="text-[9px] uppercase tracking-[0.05em] px-1.5 py-0.5 bg-[#f97316]/20 text-[#f97316] font-medium">
                        Life-threatening
                      </span>
                    )}
                    {alert.isHospitalization && (
                      <span className="text-[9px] uppercase tracking-[0.05em] px-1.5 py-0.5 bg-[#f59e0b]/20 text-[#f59e0b] font-medium">
                        Hospitalization
                      </span>
                    )}
                    <span className="text-[9px] uppercase tracking-[0.05em] px-1.5 py-0.5 bg-[#1a1a1a] text-[#555555]">
                      {alert.outcome}
                    </span>
                    <span className="text-[9px] text-[#444444] font-mono">
                      #{alert.id.slice(-6)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
