"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Search, X, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

interface DrugSuggestion {
  name: string;
  brandName?: string;
  category?: string;
}

async function fetchSuggestions(query: string): Promise<DrugSuggestion[]> {
  const params = new URLSearchParams({ drug: query, limit: "8" });
  const res = await fetch(`/api/drug-label?${params}`);
  if (!res.ok) return [];
  const data = await res.json();
  // drug-label returns a single label object; use it as a suggestion
  if (data?.genericName) {
    return [
      {
        name: data.genericName ?? query,
        brandName: data.brandName,
        category: data.productType,
      },
    ];
  }
  return [];
}

// Common drugs for quick-select
const QUICK_DRUGS = [
  "warfarin",
  "simvastatin",
  "metformin",
  "lisinopril",
  "atorvastatin",
  "phenelzine",
  "amiodarone",
  "digoxin",
  "cyclosporine",
  "fluoxetine",
  "ibuprofen",
  "omeprazole",
];

interface DrugSearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onSearch: (query: string) => void;
  placeholder?: string;
}

export function DrugSearchBar({
  value,
  onChange,
  onSearch,
  placeholder = "Search drugs by name (e.g. warfarin, metformin)...",
}: DrugSearchBarProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Debounced query for suggestions
  const [debouncedQuery, setDebouncedQuery] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(value), 300);
    return () => clearTimeout(timer);
  }, [value]);

  const { data: suggestions, isLoading: isSuggestionsLoading } = useQuery({
    queryKey: ["drug-suggestions", debouncedQuery],
    queryFn: () => fetchSuggestions(debouncedQuery),
    enabled: debouncedQuery.length >= 2,
    staleTime: 60 * 1000,
  });

  // Close suggestions on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange(e.target.value);
      setShowSuggestions(true);
    },
    [onChange]
  );

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const trimmed = value.trim();
      if (trimmed) {
        onSearch(trimmed);
        setShowSuggestions(false);
      }
    },
    [value, onSearch]
  );

  const handleClear = useCallback(() => {
    onChange("");
    onSearch("");
    inputRef.current?.focus();
  }, [onChange, onSearch]);

  const handleSuggestionClick = useCallback(
    (name: string) => {
      onChange(name);
      onSearch(name);
      setShowSuggestions(false);
    },
    [onChange, onSearch]
  );

  const handleQuickDrug = useCallback(
    (drug: string) => {
      onChange(drug);
      onSearch(drug);
    },
    [onChange, onSearch]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowSuggestions(false);
      }
    },
    []
  );

  return (
    <div className="space-y-3">
      {/* Search input */}
      <div ref={containerRef} className="relative">
        <form onSubmit={handleSubmit}>
          <div
            className={cn(
              "flex items-center gap-3 bg-[#111111] border transition-colors px-4 py-3",
              isFocused ? "border-[#00C9A7]/50" : "border-[#222222] hover:border-[#333333]"
            )}
          >
            <Search className="w-4 h-4 text-[#555555] shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={value}
              onChange={handleInputChange}
              onFocus={() => {
                setIsFocused(true);
                setShowSuggestions(true);
              }}
              onBlur={() => setIsFocused(false)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              className="flex-1 bg-transparent text-sm text-white placeholder-[#444444] outline-none"
              autoComplete="off"
            />
            {isSuggestionsLoading && (
              <Loader2 className="w-3.5 h-3.5 text-[#555555] animate-spin shrink-0" />
            )}
            {value && (
              <button
                type="button"
                onClick={handleClear}
                className="text-[#444444] hover:text-[#a1a1a1] transition-colors shrink-0"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              type="submit"
              className="shrink-0 bg-[#00C9A7] text-[#0a0a0a] text-xs font-bold px-4 py-1.5 hover:bg-[#00a88c] transition-colors"
            >
              Search
            </button>
          </div>
        </form>

        {/* Suggestions dropdown */}
        {showSuggestions && value.length >= 2 && Array.isArray(suggestions) && suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 z-50 bg-[#111111] border border-[#333333] shadow-2xl mt-1">
            {suggestions.map((s, i) => (
              <button
                key={i}
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleSuggestionClick(s.name);
                }}
                className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-[#1a1a1a] transition-colors border-b border-[#1a1a1a] last:border-0"
              >
                <div>
                  <p className="text-sm text-white capitalize">{s.name}</p>
                  {s.brandName && (
                    <p className="text-[10px] text-[#555555] mt-0.5">{s.brandName}</p>
                  )}
                </div>
                {s.category && (
                  <span className="text-[9px] uppercase tracking-wide text-[#444444] bg-[#1a1a1a] border border-[#222222] px-2 py-0.5">
                    {s.category}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Quick-select chips */}
      <div className="flex flex-wrap gap-1.5">
        <span className="text-[9px] uppercase tracking-[0.1em] text-[#444444] font-semibold self-center mr-1">
          Quick:
        </span>
        {QUICK_DRUGS.map((drug) => (
          <button
            key={drug}
            onClick={() => handleQuickDrug(drug)}
            className={cn(
              "text-[10px] px-2.5 py-1 border transition-colors capitalize",
              value === drug
                ? "bg-[#00C9A7]/10 border-[#00C9A7]/40 text-[#00C9A7]"
                : "bg-[#0f0f0f] border-[#1a1a1a] text-[#555555] hover:text-[#a1a1a1] hover:border-[#333333]"
            )}
          >
            {drug}
          </button>
        ))}
      </div>
    </div>
  );
}
