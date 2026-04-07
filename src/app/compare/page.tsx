"use client";

import { useState, useCallback } from "react";
import { useQueries } from "@tanstack/react-query";
import { GitCompare, Info } from "lucide-react";
import { DrugComparePanel } from "@/components/compare/DrugComparePanel";
import { ComparisonHeatmap } from "@/components/compare/ComparisonHeatmap";
import { SideBySideMatrix } from "@/components/compare/SideBySideMatrix";
import type { AdverseEventSummary, DrugFoodInteraction } from "@/lib/types";

// ============================================================
// Fetch helpers
// ============================================================

async function fetchAdverseEvents(drug: string): Promise<AdverseEventSummary> {
  const params = new URLSearchParams({ drug, limit: "25" });
  const res = await fetch(`/api/adverse-events?${params}`);
  if (!res.ok) throw new Error(`Failed to fetch adverse events for ${drug}`);
  return res.json();
}

async function fetchInteractions(drug: string): Promise<{ interactions: DrugFoodInteraction[] }> {
  const params = new URLSearchParams({ drug });
  const res = await fetch(`/api/drug-interactions?${params}`);
  if (!res.ok) throw new Error(`Failed to fetch interactions for ${drug}`);
  return res.json();
}

// ============================================================
// Page
// ============================================================

export default function ComparePage() {
  const [drugs, setDrugs] = useState<(string | null)[]>(["warfarin", "simvastatin", null]);

  const activeDrugs = drugs.filter((d): d is string => d !== null && d.trim() !== "");

  // Parallel queries for adverse events
  const adverseQueries = useQueries({
    queries: drugs.map((drug) => ({
      queryKey: ["adverse-events", drug],
      queryFn: () => fetchAdverseEvents(drug!),
      enabled: drug !== null && drug.trim() !== "",
      staleTime: 5 * 60 * 1000,
    })),
  });

  // Parallel queries for interactions
  const interactionQueries = useQueries({
    queries: drugs.map((drug) => ({
      queryKey: ["drug-interactions", drug],
      queryFn: () => fetchInteractions(drug!),
      enabled: drug !== null && drug.trim() !== "",
      staleTime: 5 * 60 * 1000,
    })),
  });

  // Build drug data list for heatmap
  const drugDataList = drugs.map((drug, i) => ({
    drug: drug ?? "",
    data: adverseQueries[i]?.data,
    isLoading: adverseQueries[i]?.isLoading ?? false,
  }));

  // Build drug entries for matrix
  const drugEntries = drugs.map((drug, i) => ({
    drug: drug ?? "",
    adverseData: adverseQueries[i]?.data,
    interactionData: interactionQueries[i]?.data,
    isLoading: adverseQueries[i]?.isLoading || interactionQueries[i]?.isLoading || false,
  }));

  const handleDrugsChange = useCallback((next: (string | null)[]) => {
    setDrugs(next);
  }, []);

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-6 h-6 bg-[#00C9A7]/10 border border-[#00C9A7]/20 flex items-center justify-center">
              <GitCompare className="w-3.5 h-3.5 text-[#00C9A7]" />
            </div>
            <h1 className="text-lg font-light text-white tracking-tight">Drug Comparison</h1>
          </div>
          <p className="text-xs text-[#555555] ml-8.5">
            Compare adverse event profiles, safety metrics, and food interaction signals across up to 3 drugs
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-[#555555] bg-[#111111] border border-[#1a1a1a] px-3 py-2">
          <Info className="w-3 h-3 shrink-0" />
          <span>Data sourced from FDA FAERS</span>
        </div>
      </div>

      {/* Drug selector */}
      <DrugComparePanel drugs={drugs} onDrugsChange={handleDrugsChange} />

      {/* No drugs selected state */}
      {activeDrugs.length === 0 && (
        <div className="bg-[#111111] border border-[#222222] flex flex-col items-center justify-center py-20 text-center">
          <GitCompare className="w-8 h-8 text-[#333333] mb-3" />
          <p className="text-sm text-[#555555]">Select at least one drug to begin comparison</p>
          <p className="text-xs text-[#444444] mt-1">Use the drug selector above to add drugs</p>
        </div>
      )}

      {/* Comparison heatmap */}
      {activeDrugs.length > 0 && (
        <ComparisonHeatmap drugDataList={drugDataList} />
      )}

      {/* Side-by-side matrix */}
      {activeDrugs.length > 0 && (
        <SideBySideMatrix drugEntries={drugEntries} />
      )}

      {/* Demographic skew note */}
      {activeDrugs.length > 0 && (
        <div className="bg-[#111111] border border-[#1a1a1a] px-5 py-4">
          <div className="flex items-start gap-3">
            <Info className="w-4 h-4 text-[#3D56F0] shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-[#a1a1a1] uppercase tracking-wide">
                Methodology Note
              </p>
              <p className="text-xs text-[#555555] mt-1 leading-relaxed">
                Adverse event counts are sourced from FDA FAERS and represent spontaneous reports — not incidence rates.
                Reaction intensities in the heatmap are normalized per-drug (0–100 scale) to enable cross-drug comparison
                independent of total report volume. Food interaction signals are derived from known pharmacokinetic
                pathways and FAERS co-report analysis.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
