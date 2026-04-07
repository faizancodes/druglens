"use client";

import { use } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { DrugDetailHeader } from "@/components/drug/DrugDetailHeader";
import { AdverseEventTimeline } from "@/components/drug/AdverseEventTimeline";
import { ReactionBreakdownChart } from "@/components/drug/ReactionBreakdownChart";
import { DrugLabelPanel } from "@/components/drug/DrugLabelPanel";
import { DemographicsPanel } from "@/components/dashboard/DemographicsPanel";
import type { DrugLabelData } from "@/components/drug/DrugLabelPanel";

export default function DrugPage({
  params,
}: {
  params: Promise<{ name: string }>;
}) {
  const { name } = use(params);
  const drugName = decodeURIComponent(name);

  const { data: events, isLoading: eventsLoading } = useQuery({
    queryKey: ["adverse-events", drugName],
    queryFn: async () => {
      const res = await fetch(
        `/api/adverse-events?drug=${encodeURIComponent(drugName)}&limit=100`
      );
      if (!res.ok) return { results: [], total: 0, reactions: [], timeline: [] };
      return res.json();
    },
  });

  const { data: label, isLoading: labelLoading } = useQuery({
    queryKey: ["drug-label", drugName],
    queryFn: async () => {
      const res = await fetch(
        `/api/drug-label?drug=${encodeURIComponent(drugName)}`
      );
      if (!res.ok) return null;
      return res.json() as Promise<DrugLabelData>;
    },
  });

  const { data: timeline, isLoading: timelineLoading } = useQuery({
    queryKey: ["timeline", drugName],
    queryFn: async () => {
      const res = await fetch(
        `/api/adverse-events/timeline?drug=${encodeURIComponent(drugName)}`
      );
      if (!res.ok) return [];
      const data = await res.json();
      return data.timeline || [];
    },
  });

  const totalReports = events?.total ?? 0;
  const seriousCount =
    events?.results?.filter((e: { serious: string }) => e.serious === "1")
      .length ?? 0;
  const deathCount =
    events?.results?.filter(
      (e: { seriousnessdeath: string }) => e.seriousnessdeath === "1"
    ).length ?? 0;
  const hospCount =
    events?.results?.filter(
      (e: { seriousnesshospitalization: string }) =>
        e.seriousnesshospitalization === "1"
    ).length ?? 0;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Back nav */}
      <div className="border-b border-[#1a1a1a] px-8 py-3">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-[#a1a1a1] hover:text-white transition-colors"
        >
          <ArrowLeft size={14} />
          Back to search
        </Link>
      </div>

      <div className="max-w-7xl mx-auto px-8 py-8 space-y-8">
        <DrugDetailHeader
          drugName={drugName}
          brandName={label?.brandName}
          genericName={label?.genericName}
          manufacturer={label?.manufacturer}
          totalReports={totalReports}
          seriousReports={seriousCount}
          deathReports={deathCount}
          hospitalizationReports={hospCount}
          isLoading={eventsLoading}
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <AdverseEventTimeline
            data={timeline ?? []}
            isLoading={timelineLoading}
          />
          <ReactionBreakdownChart
            reactions={events?.reactions ?? []}
            isLoading={eventsLoading}
          />
        </div>

        <DemographicsPanel drug={drugName} />

        <DrugLabelPanel label={label ?? null} isLoading={labelLoading} />
      </div>
    </div>
  );
}
