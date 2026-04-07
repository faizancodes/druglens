"use client";

import { useState, useCallback, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Compass, Info } from "lucide-react";
import { DrugSearchBar } from "@/components/explore/DrugSearchBar";
import { FilterPanel } from "@/components/explore/FilterPanel";
import { ResultsTable } from "@/components/explore/ResultsTable";
import { useFilterStore } from "@/store/useFilterStore";
import type { DrugRow } from "@/components/explore/ResultsTable";

interface ExploreResponse {
  items: DrugRow[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  _fallback?: boolean;
}

async function fetchExploreResults(params: {
  q: string;
  riskTier: string;
  seriousness: string;
  sortBy: string;
  sortOrder: string;
  page: number;
  pageSize: number;
}): Promise<ExploreResponse> {
  const searchParams = new URLSearchParams({
    q: params.q || "warfarin",
    riskTier: params.riskTier,
    seriousness: params.seriousness,
    sortBy: params.sortBy,
    sortOrder: params.sortOrder,
    page: String(params.page),
    pageSize: String(params.pageSize),
  });
  const res = await fetch(`/api/explore?${searchParams}`);
  if (!res.ok) throw new Error("Failed to fetch explore results");
  return res.json();
}

export default function ExplorePage() {
  const { drugFilters } = useFilterStore();

  const [searchQuery, setSearchQuery] = useState("warfarin");
  const [debouncedQuery, setDebouncedQuery] = useState("warfarin");
  const [page, setPage] = useState(1);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
      setPage(1); // Reset to page 1 on new search
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [drugFilters.riskTierFilter, drugFilters.seriousnessFilter, drugFilters.sortBy, drugFilters.sortOrder]);

  const queryParams = {
    q: debouncedQuery,
    riskTier: drugFilters.riskTierFilter,
    seriousness: drugFilters.seriousnessFilter,
    sortBy: drugFilters.sortBy,
    sortOrder: drugFilters.sortOrder,
    page,
    pageSize: drugFilters.pageSize,
  };

  const { data, isLoading, error, refetch } = useQuery<ExploreResponse>({
    queryKey: ["explore", queryParams],
    queryFn: () => fetchExploreResults(queryParams),
    staleTime: 2 * 60 * 1000,
    placeholderData: (prev) => prev,
  });

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
  }, []);

  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const handleSortChange = useCallback(
    (sortBy: string, sortOrder: "asc" | "desc") => {
      const { setDrugFilter } = useFilterStore.getState();
      setDrugFilter("sortBy", sortBy as typeof drugFilters.sortBy);
      setDrugFilter("sortOrder", sortOrder);
    },
    []
  );

  const items = Array.isArray(data?.items) ? data.items : [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-6 h-6 bg-[#3D56F0]/10 border border-[#3D56F0]/20 flex items-center justify-center">
              <Compass className="w-3.5 h-3.5 text-[#3D56F0]" />
            </div>
            <h1 className="text-lg font-light text-white tracking-tight">Drug Explorer</h1>
          </div>
          <p className="text-xs text-[#555555] ml-8.5">
            Search and filter FDA FAERS adverse event data across thousands of drugs
          </p>
        </div>
        {data?._fallback && (
          <div className="flex items-center gap-1.5 text-[10px] text-[#f59e0b] bg-[#f59e0b]/5 border border-[#f59e0b]/20 px-3 py-2">
            <Info className="w-3 h-3 shrink-0" />
            <span>Using cached data — FDA API unavailable</span>
          </div>
        )}
      </div>

      {/* Search bar */}
      <div className="bg-[#111111] border border-[#222222] p-5">
        <DrugSearchBar
          value={searchQuery}
          onChange={handleSearchChange}
          onSearch={handleSearch}
        />
      </div>

      {/* Filters */}
      <FilterPanel onFiltersChange={() => setPage(1)} />

      {/* Error state */}
      {error && !isLoading && (
        <div className="bg-[#111111] border border-[#ef4444]/20 px-5 py-4 flex items-center justify-between">
          <p className="text-sm text-[#ef4444]">Failed to load results</p>
          <button
            onClick={() => refetch()}
            className="text-xs text-[#00C9A7] hover:underline"
          >
            Try again
          </button>
        </div>
      )}

      {/* Results table */}
      <ResultsTable
        data={items}
        isLoading={isLoading}
        total={total}
        page={page}
        pageSize={drugFilters.pageSize}
        totalPages={totalPages}
        onPageChange={handlePageChange}
        onSortChange={handleSortChange}
      />

      {/* Methodology note */}
      <div className="bg-[#111111] border border-[#1a1a1a] px-5 py-4">
        <div className="flex items-start gap-3">
          <Info className="w-4 h-4 text-[#3D56F0] shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-semibold text-[#a1a1a1] uppercase tracking-wide">
              Data Source
            </p>
            <p className="text-xs text-[#555555] mt-1 leading-relaxed">
              Results are sourced from the FDA Adverse Event Reporting System (FAERS) via the openFDA API.
              Risk scores are computed from total report volume, serious event percentage, and known
              food-drug interaction signals. Data is refreshed every 5 minutes. Counts represent
              spontaneous reports and should not be interpreted as incidence rates.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
