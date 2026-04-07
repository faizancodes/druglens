"use client";

import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Salad,
  Pill,
  ChevronDown,
  Search,
  AlertTriangle,
  TrendingUp,
  Layers,
} from "lucide-react";
import type { USDAFood } from "@/lib/types";
import { FoodSearchPanel } from "@/components/food/FoodSearchPanel";
import { IngredientRiskScoreCard } from "@/components/food/IngredientRiskScoreCard";
import { FoodInteractionMatrix } from "@/components/food/FoodInteractionMatrix";
import { NutrientProfileChart } from "@/components/food/NutrientProfileChart";
import { cn } from "@/lib/utils";

// ============================================================
// Drug selector
// ============================================================

const COMMON_DRUGS = [
  { name: "warfarin", label: "Warfarin", category: "Anticoagulant" },
  { name: "simvastatin", label: "Simvastatin", category: "Statin" },
  { name: "atorvastatin", label: "Atorvastatin", category: "Statin" },
  { name: "phenelzine", label: "Phenelzine", category: "MAOI" },
  { name: "metformin", label: "Metformin", category: "Antidiabetic" },
  { name: "lisinopril", label: "Lisinopril", category: "ACE Inhibitor" },
  { name: "cyclosporine", label: "Cyclosporine", category: "Immunosuppressant" },
  { name: "digoxin", label: "Digoxin", category: "Cardiac Glycoside" },
];

interface DrugSelectorProps {
  selectedDrug: string;
  onSelectDrug: (drug: string) => void;
}

function DrugSelector({ selectedDrug, onSelectDrug }: DrugSelectorProps) {
  const [customDrug, setCustomDrug] = useState("");
  const [isCustom, setIsCustom] = useState(false);

  const handleCustomSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (customDrug.trim()) {
        onSelectDrug(customDrug.trim().toLowerCase());
        setIsCustom(false);
      }
    },
    [customDrug, onSelectDrug]
  );

  return (
    <div className="bg-[#111111] border border-[#222222] p-5">
      <div className="flex items-center gap-2 mb-4">
        <Pill className="w-4 h-4 text-[#00C9A7]" />
        <h2 className="text-xs font-semibold uppercase tracking-[0.05em] text-[#a1a1a1]">
          Drug Selection
        </h2>
      </div>

      {/* Quick-select grid */}
      <div className="grid grid-cols-2 gap-1.5 mb-3">
        {COMMON_DRUGS.map((drug) => (
          <button
            key={drug.name}
            onClick={() => onSelectDrug(drug.name)}
            className={cn(
              "text-left px-3 py-2 border transition-colors",
              selectedDrug === drug.name
                ? "bg-[#00C9A7]/10 border-[#00C9A7]/40 text-[#00C9A7]"
                : "bg-[#0f0f0f] border-[#1a1a1a] text-[#666666] hover:text-[#a1a1a1] hover:border-[#333333]"
            )}
          >
            <p className="text-xs font-semibold">{drug.label}</p>
            <p className="text-[9px] uppercase tracking-wide text-[#444444] mt-0.5">
              {drug.category}
            </p>
          </button>
        ))}
      </div>

      {/* Custom drug input */}
      {isCustom ? (
        <form onSubmit={handleCustomSubmit} className="flex gap-2">
          <input
            type="text"
            value={customDrug}
            onChange={(e) => setCustomDrug(e.target.value)}
            placeholder="Enter drug name…"
            autoFocus
            className="flex-1 bg-[#0f0f0f] border border-[#222222] text-sm text-white placeholder-[#555555] px-3 py-2 focus:outline-none focus:border-[#00C9A7] transition-colors"
          />
          <button
            type="submit"
            disabled={!customDrug.trim()}
            className="px-3 py-2 bg-[#00C9A7] text-[#0a0a0a] text-xs font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#00a88c] transition-colors"
          >
            <Search className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setIsCustom(false)}
            className="px-3 py-2 bg-[#1a1a1a] text-[#666666] text-xs hover:text-[#a1a1a1] transition-colors"
          >
            ✕
          </button>
        </form>
      ) : (
        <button
          onClick={() => setIsCustom(true)}
          className="w-full text-xs text-[#555555] hover:text-[#a1a1a1] border border-dashed border-[#222222] hover:border-[#333333] py-2 transition-colors"
        >
          + Enter custom drug name
        </button>
      )}

      {selectedDrug && (
        <div className="mt-3 pt-3 border-t border-[#1a1a1a]">
          <p className="text-[9px] uppercase tracking-[0.08em] text-[#555555]">
            Active Drug
          </p>
          <p className="text-sm font-semibold text-[#00C9A7] mt-0.5 capitalize">
            {selectedDrug}
          </p>
        </div>
      )}
    </div>
  );
}

// ============================================================
// Stats bar
// ============================================================

interface InteractionStatsResponse {
  drug: string;
  totalSignals: number;
  criticalCount: number;
  highCount: number;
  moderateCount: number;
  lowCount: number;
}

function InteractionStatsBar({ drug }: { drug: string }) {
  const { data } = useQuery({
    queryKey: ["drug-interactions", drug],
    queryFn: async () => {
      const params = new URLSearchParams({ drug });
      const res = await fetch(`/api/drug-interactions?${params}`);
      if (!res.ok) throw new Error("Failed");
      return res.json() as Promise<InteractionStatsResponse>;
    },
    enabled: !!drug,
    staleTime: 5 * 60_000,
  });

  if (!data) return null;

  const stats = [
    {
      label: "Total Signals",
      value: data.totalSignals,
      color: "text-white",
      icon: TrendingUp,
    },
    {
      label: "Critical",
      value: data.criticalCount,
      color: "text-[#ef4444]",
      icon: AlertTriangle,
    },
    {
      label: "High Risk",
      value: data.highCount,
      color: "text-[#f59e0b]",
      icon: AlertTriangle,
    },
    {
      label: "Moderate",
      value: data.moderateCount,
      color: "text-[#3D56F0]",
      icon: Layers,
    },
  ];

  return (
    <div className="grid grid-cols-4 gap-px bg-[#1a1a1a] border border-[#222222]">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <div key={stat.label} className="bg-[#111111] px-4 py-3 flex items-center gap-3">
            <Icon className={cn("w-4 h-4 shrink-0", stat.color)} />
            <div>
              <p className={cn("text-lg font-bold leading-none", stat.color)}>{stat.value}</p>
              <p className="text-[9px] uppercase tracking-[0.08em] text-[#555555] mt-0.5">
                {stat.label}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ============================================================
// Page
// ============================================================

export default function FoodInteractionsPage() {
  const [selectedDrug, setSelectedDrug] = useState("warfarin");
  const [selectedFood, setSelectedFood] = useState<USDAFood | null>(null);

  const handleSelectFood = useCallback((food: USDAFood) => {
    setSelectedFood(food);
  }, []);

  const handleSelectDrug = useCallback((drug: string) => {
    setSelectedDrug(drug);
  }, []);

  return (
    <div className="min-h-full">
      {/* Page header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 bg-[#00C9A7]/10 border border-[#00C9A7]/20 flex items-center justify-center">
            <Salad className="w-4 h-4 text-[#00C9A7]" />
          </div>
          <div>
            <h1 className="text-xl font-light text-white tracking-tight">
              Food–Drug Interaction Matrix
            </h1>
            <p className="text-xs text-[#555555] mt-0.5">
              Cross-reference USDA FoodData Central nutrient profiles with FDA FAERS adverse event signals
            </p>
          </div>
        </div>

        {/* Stats bar */}
        {selectedDrug && (
          <div className="mt-4">
            <InteractionStatsBar drug={selectedDrug} />
          </div>
        )}
      </div>

      {/* Main layout */}
      <div className="grid grid-cols-1 xl:grid-cols-[280px_1fr] gap-4">
        {/* Left sidebar — controls */}
        <div className="flex flex-col gap-4">
          {/* Drug selector */}
          <DrugSelector selectedDrug={selectedDrug} onSelectDrug={handleSelectDrug} />

          {/* Food search */}
          <div className="bg-[#111111] border border-[#222222] p-5">
            <FoodSearchPanel
              selectedFood={selectedFood}
              onSelectFood={handleSelectFood}
            />
          </div>

          {/* Nutrient profile chart */}
          <NutrientProfileChart food={selectedFood} />
        </div>

        {/* Right content area */}
        <div className="flex flex-col gap-4">
          {/* Interaction matrix */}
          <FoodInteractionMatrix drug={selectedDrug} selectedFood={selectedFood} />

          {/* Risk score card */}
          <IngredientRiskScoreCard drug={selectedDrug} food={selectedFood} />
        </div>
      </div>

      {/* Methodology note */}
      <div className="mt-6 bg-[#0f0f0f] border border-[#1a1a1a] px-5 py-4">
        <div className="flex items-start gap-3">
          <div className="w-5 h-5 bg-[#3D56F0]/10 border border-[#3D56F0]/20 flex items-center justify-center shrink-0 mt-0.5">
            <span className="text-[10px] text-[#3D56F0] font-bold">i</span>
          </div>
          <div>
            <p className="text-xs font-semibold text-[#a1a1a1] mb-1">Methodology</p>
            <p className="text-xs text-[#555555] leading-relaxed">
              Interaction signals are derived from FDA FAERS adverse event reports cross-referenced with
              USDA FoodData Central nutrient concentrations and known pharmacokinetic interaction mechanisms.
              Risk scores combine FAERS signal counts, evidence level (established/probable/possible/theoretical),
              and compound concentration thresholds. This tool is for research purposes only and does not
              constitute clinical advice.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
