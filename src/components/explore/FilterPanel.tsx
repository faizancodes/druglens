"use client";

import { useCallback } from "react";
import { SlidersHorizontal, RotateCcw, ChevronDown } from "lucide-react";
import { useFilterStore } from "@/store/useFilterStore";
import { cn } from "@/lib/utils";

const REACTION_TYPES = [
  { value: "", label: "All Reactions" },
  { value: "nausea", label: "Nausea" },
  { value: "headache", label: "Headache" },
  { value: "dizziness", label: "Dizziness" },
  { value: "haemorrhage", label: "Haemorrhage" },
  { value: "dyspnoea", label: "Dyspnoea" },
  { value: "rash", label: "Rash" },
  { value: "fatigue", label: "Fatigue" },
  { value: "pain", label: "Pain" },
];

const SEVERITY_OPTIONS = [
  { value: "all", label: "All Severity" },
  { value: "serious", label: "Serious Only" },
  { value: "non-serious", label: "Non-Serious Only" },
];

interface SelectFieldProps {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}

function SelectField({ label, value, options, onChange }: SelectFieldProps) {
  return (
    <div className="space-y-1.5">
      <label className="text-[9px] uppercase tracking-[0.1em] text-[#555555] font-semibold block">
        {label}
      </label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full appearance-none bg-[#0f0f0f] border border-[#222222] text-xs text-[#a1a1a1] px-3 py-2 pr-8 outline-none hover:border-[#333333] focus:border-[#00C9A7]/50 transition-colors cursor-pointer"
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-[#111111]">
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-[#444444] pointer-events-none" />
      </div>
    </div>
  );
}

interface FilterPanelProps {
  onFiltersChange?: () => void;
}

export function FilterPanel({ onFiltersChange }: FilterPanelProps) {
  const { drugFilters, setDrugFilter, resetDrugFilters } = useFilterStore();

  const handleChange = useCallback(
    <K extends keyof typeof drugFilters>(key: K, value: (typeof drugFilters)[K]) => {
      setDrugFilter(key, value);
      onFiltersChange?.();
    },
    [setDrugFilter, onFiltersChange]
  );

  const handleReset = useCallback(() => {
    resetDrugFilters();
    onFiltersChange?.();
  }, [resetDrugFilters, onFiltersChange]);

  const hasActiveFilters =
    drugFilters.riskTierFilter !== "all" ||
    (Array.isArray(drugFilters.reactionFilter) && drugFilters.reactionFilter.length > 0) ||
    drugFilters.seriousnessFilter !== "all";

  return (
    <div className="bg-[#111111] border border-[#222222]">
      <div className="px-5 py-4 border-b border-[#222222] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-3.5 h-3.5 text-[#00C9A7]" />
          <h2 className="text-xs font-semibold uppercase tracking-[0.05em] text-[#a1a1a1]">
            Filters
          </h2>
          {hasActiveFilters && (
            <span className="text-[9px] bg-[#00C9A7]/10 text-[#00C9A7] border border-[#00C9A7]/20 px-1.5 py-0.5 uppercase tracking-wide font-semibold">
              Active
            </span>
          )}
        </div>
        {hasActiveFilters && (
          <button
            onClick={handleReset}
            className="flex items-center gap-1 text-[10px] text-[#555555] hover:text-[#a1a1a1] transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            Reset
          </button>
        )}
      </div>

      <div className="p-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <SelectField
          label="Risk Tier"
          value={drugFilters.riskTierFilter}
          options={[
            { value: "all", label: "All Risk Tiers" },
            { value: "critical", label: "Critical" },
            { value: "high", label: "High" },
            { value: "moderate", label: "Moderate" },
            { value: "low", label: "Low" },
            { value: "minimal", label: "Minimal" },
          ]}
          onChange={(v) => handleChange("riskTierFilter", v as typeof drugFilters.riskTierFilter)}
        />
        <SelectField
          label="Reaction Filter"
          value={Array.isArray(drugFilters.reactionFilter) && drugFilters.reactionFilter.length > 0 ? drugFilters.reactionFilter[0] : ""}
          options={REACTION_TYPES}
          onChange={(v) => handleChange("reactionFilter", v ? [v] : [])}
        />
        <SelectField
          label="Severity"
          value={drugFilters.seriousnessFilter}
          options={SEVERITY_OPTIONS}
          onChange={(v) => handleChange("seriousnessFilter", v as typeof drugFilters.seriousnessFilter)}
        />
        <SelectField
          label="Sort By"
          value={drugFilters.sortBy}
          options={[
            { value: "reports", label: "Total Reports" },
            { value: "risk", label: "Risk Score" },
            { value: "name", label: "Drug Name" },
            { value: "date", label: "Date" },
          ]}
          onChange={(v) => handleChange("sortBy", v as typeof drugFilters.sortBy)}
        />
        <SelectField
          label="Sort Order"
          value={drugFilters.sortOrder}
          options={[
            { value: "desc", label: "Descending" },
            { value: "asc", label: "Ascending" },
          ]}
          onChange={(v) => handleChange("sortOrder", v as typeof drugFilters.sortOrder)}
        />
      </div>
    </div>
  );
}
