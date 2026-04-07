"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, X, Leaf, ChevronRight, AlertTriangle } from "lucide-react";
import type { USDAFood, USDAFoodNutrient } from "@/lib/types";
import { cn } from "@/lib/utils";
import { InlineLoader } from "@/components/ui/LoadingState";

// Interaction-relevant nutrient IDs to highlight
const HIGHLIGHT_NUTRIENT_IDS = new Set([
  1185, // Vitamin K
  1162, // Vitamin C
  1092, // Potassium
  1087, // Calcium
  1089, // Iron
]);

const INTERACTION_KEYWORDS: Record<string, { label: string; color: string }> = {
  grapefruit: { label: "Furanocoumarins", color: "text-[#ef4444]" },
  pomelo: { label: "Furanocoumarins", color: "text-[#ef4444]" },
  spinach: { label: "Vitamin K ↑", color: "text-[#f59e0b]" },
  kale: { label: "Vitamin K ↑", color: "text-[#f59e0b]" },
  broccoli: { label: "Vitamin K ↑", color: "text-[#f59e0b]" },
  cheese: { label: "Tyramine", color: "text-[#ef4444]" },
  wine: { label: "Tyramine", color: "text-[#ef4444]" },
  tea: { label: "Tannins", color: "text-[#a1a1a1]" },
  banana: { label: "Potassium ↑", color: "text-[#3D56F0]" },
  avocado: { label: "Vitamin K ↑", color: "text-[#f59e0b]" },
};

function getInteractionFlag(description: string): { label: string; color: string } | null {
  const lower = description.toLowerCase();
  for (const [keyword, flag] of Object.entries(INTERACTION_KEYWORDS)) {
    if (lower.includes(keyword)) return flag;
  }
  return null;
}

function getHighlightNutrients(nutrients: USDAFoodNutrient[]): string[] {
  if (!Array.isArray(nutrients)) return [];
  return nutrients
    .filter((n) => HIGHLIGHT_NUTRIENT_IDS.has(n.nutrientId) && n.value > 0)
    .map((n) => `${n.nutrientName.replace(/, total.*/, "").replace(/\(.*\)/, "").trim()} ${n.value.toFixed(1)}${n.unitName.toLowerCase()}`);
}

interface FoodSearchPanelProps {
  selectedFood: USDAFood | null;
  onSelectFood: (food: USDAFood) => void;
  className?: string;
}

export function FoodSearchPanel({ selectedFood, onSelectFood, className }: FoodSearchPanelProps) {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounce input
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedQuery(val);
      if (val.trim().length > 1) setIsOpen(true);
      else setIsOpen(false);
    }, 300);
  }, []);

  const { data, isLoading } = useQuery({
    queryKey: ["food-search", debouncedQuery],
    queryFn: async () => {
      const params = new URLSearchParams({ q: debouncedQuery, pageSize: "12" });
      const res = await fetch(`/api/food-data/search?${params}`);
      if (!res.ok) throw new Error("Search failed");
      return res.json() as Promise<{ foods: USDAFood[]; totalHits: number }>;
    },
    enabled: debouncedQuery.trim().length > 1,
    staleTime: 60_000,
  });

  const foods = Array.isArray(data?.foods) ? data.foods : [];

  const handleSelect = useCallback(
    (food: USDAFood) => {
      onSelectFood(food);
      setQuery(food.description);
      setIsOpen(false);
    },
    [onSelectFood]
  );

  const handleClear = useCallback(() => {
    setQuery("");
    setDebouncedQuery("");
    setIsOpen(false);
    inputRef.current?.focus();
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      {/* Header */}
      <div className="flex items-center gap-2">
        <Leaf className="w-4 h-4 text-[#00C9A7]" />
        <h2 className="text-xs font-semibold uppercase tracking-[0.05em] text-[#a1a1a1]">
          Food Search
        </h2>
      </div>

      {/* Search input */}
      <div className="relative">
        <div className="relative flex items-center">
          <Search className="absolute left-3 w-4 h-4 text-[#555555] pointer-events-none" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleInputChange}
            onFocus={() => {
              if (debouncedQuery.trim().length > 1 && foods.length > 0) setIsOpen(true);
            }}
            placeholder="Search USDA FoodData Central…"
            className={cn(
              "w-full bg-[#0f0f0f] border border-[#222222] text-sm text-white placeholder-[#555555]",
              "pl-9 pr-9 py-2.5 focus:outline-none focus:border-[#00C9A7] transition-colors"
            )}
          />
          {isLoading && (
            <div className="absolute right-3">
              <InlineLoader />
            </div>
          )}
          {!isLoading && query && (
            <button
              onClick={handleClear}
              className="absolute right-3 text-[#555555] hover:text-[#a1a1a1] transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Dropdown */}
        {isOpen && (
          <div
            ref={dropdownRef}
            className="absolute top-full left-0 right-0 z-50 mt-1 bg-[#111111] border border-[#222222] shadow-2xl max-h-80 overflow-y-auto"
          >
            {foods.length === 0 && !isLoading && debouncedQuery.length > 1 && (
              <div className="px-4 py-6 text-center">
                <p className="text-xs text-[#555555]">No foods found for "{debouncedQuery}"</p>
              </div>
            )}
            {foods.map((food) => {
              const flag = getInteractionFlag(food.description);
              const highlights = getHighlightNutrients(food.foodNutrients);
              const isSelected = selectedFood?.fdcId === food.fdcId;
              return (
                <button
                  key={food.fdcId}
                  onClick={() => handleSelect(food)}
                  className={cn(
                    "w-full text-left px-4 py-3 border-b border-[#1a1a1a] last:border-0",
                    "hover:bg-[#141414] transition-colors group",
                    isSelected && "bg-[#00C9A7]/5 border-l-2 border-l-[#00C9A7]"
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate group-hover:text-[#00C9A7] transition-colors">
                        {food.description}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        {food.foodCategory && (
                          <span className="text-[10px] text-[#555555]">{food.foodCategory}</span>
                        )}
                        {flag && (
                          <span className={cn("text-[10px] font-semibold uppercase tracking-wide", flag.color)}>
                            ⚠ {flag.label}
                          </span>
                        )}
                      </div>
                      {highlights.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {highlights.slice(0, 3).map((h) => (
                            <span
                              key={h}
                              className="text-[9px] px-1.5 py-0.5 bg-[#1a1a1a] text-[#a1a1a1] rounded-[2px] uppercase tracking-wide"
                            >
                              {h}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-[#333333] group-hover:text-[#00C9A7] shrink-0 mt-0.5 transition-colors" />
                  </div>
                </button>
              );
            })}
            {data?.totalHits != null && data.totalHits > foods.length && (
              <div className="px-4 py-2 border-t border-[#1a1a1a]">
                <p className="text-[10px] text-[#555555]">
                  Showing {foods.length} of {data.totalHits.toLocaleString()} results
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Selected food summary */}
      {selectedFood && (
        <div className="bg-[#0f0f0f] border border-[#222222] p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.05em] text-[#00C9A7] mb-1">
                Selected Food
              </p>
              <p className="text-sm text-white font-medium truncate">{selectedFood.description}</p>
              {selectedFood.foodCategory && (
                <p className="text-xs text-[#555555] mt-0.5">{selectedFood.foodCategory}</p>
              )}
            </div>
            <button
              onClick={handleClear}
              className="shrink-0 text-[#444444] hover:text-[#a1a1a1] transition-colors mt-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Interaction flags */}
          {(() => {
            const flag = getInteractionFlag(selectedFood.description);
            return flag ? (
              <div className="mt-3 flex items-center gap-2 bg-[#ef4444]/5 border border-[#ef4444]/20 px-3 py-2">
                <AlertTriangle className="w-3.5 h-3.5 text-[#ef4444] shrink-0" />
                <p className="text-xs text-[#ef4444]">
                  Known interaction compound: <strong>{flag.label}</strong>
                </p>
              </div>
            ) : null;
          })()}

          {/* Nutrient highlights */}
          {(() => {
            const highlights = getHighlightNutrients(selectedFood.foodNutrients);
            return highlights.length > 0 ? (
              <div className="mt-3">
                <p className="text-[9px] uppercase tracking-[0.08em] text-[#555555] mb-1.5">
                  Key Nutrients
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {highlights.map((h) => (
                    <span
                      key={h}
                      className="text-[10px] px-2 py-0.5 bg-[#1a1a1a] border border-[#222222] text-[#a1a1a1] rounded-[2px]"
                    >
                      {h}
                    </span>
                  ))}
                </div>
              </div>
            ) : null;
          })()}
        </div>
      )}

      {/* Quick-select common foods */}
      {!selectedFood && (
        <div>
          <p className="text-[9px] uppercase tracking-[0.08em] text-[#555555] mb-2">
            Common Interaction Foods
          </p>
          <div className="flex flex-wrap gap-1.5">
            {[
              "Grapefruit",
              "Spinach",
              "Kale",
              "Aged cheese",
              "Green tea",
              "Broccoli",
              "Banana",
              "Avocado",
            ].map((food) => (
              <button
                key={food}
                onClick={() => {
                  setQuery(food);
                  setDebouncedQuery(food);
                  setIsOpen(true);
                }}
                className="text-[10px] px-2.5 py-1 bg-[#111111] border border-[#222222] text-[#666666] hover:text-[#a1a1a1] hover:border-[#333333] transition-colors rounded-[2px]"
              >
                {food}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
