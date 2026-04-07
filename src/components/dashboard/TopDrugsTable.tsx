"use client";

import { useState, useMemo, useCallback } from "react";
import { RiskBadge } from "@/components/ui/Badge";
import { formatNumber } from "@/lib/utils";
import type { RiskTier } from "@/lib/types";
import { ChevronUp, ChevronDown, ChevronsUpDown, Search } from "lucide-react";

interface DrugRow {
  name: string;
  genericName: string;
  totalReports: number;
  riskScore: number;
  riskTier: string;
  topReaction: string;
  interactionCount: number;
}

interface TopDrugsTableProps {
  drugs: DrugRow[];
  isLoading?: boolean;
}

type SortKey = keyof Pick<DrugRow, "name" | "totalReports" | "riskScore" | "interactionCount">;
type SortDir = "asc" | "desc";

function SortIcon({ column, sortKey, sortDir }: { column: SortKey; sortKey: SortKey; sortDir: SortDir }) {
  if (column !== sortKey) return <ChevronsUpDown className="w-3 h-3 text-[#444444]" />;
  return sortDir === "asc"
    ? <ChevronUp className="w-3 h-3 text-[#3D56F0]" />
    : <ChevronDown className="w-3 h-3 text-[#3D56F0]" />;
}

function TableSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-8 bg-[#0d0d0d] border-b border-[#1a1a1a] mb-1" />
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex gap-3 py-3 border-b border-[#111111]">
          <div className="w-6 h-4 bg-[#1a1a1a] rounded" />
          <div className="flex-1 h-4 bg-[#1a1a1a] rounded" />
          <div className="w-20 h-4 bg-[#1a1a1a] rounded" />
          <div className="w-16 h-4 bg-[#1a1a1a] rounded" />
          <div className="w-24 h-4 bg-[#1a1a1a] rounded" />
          <div className="w-12 h-4 bg-[#1a1a1a] rounded" />
        </div>
      ))}
    </div>
  );
}

export function TopDrugsTable({ drugs, isLoading = false }: TopDrugsTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>("totalReports");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 10;

  const handleSort = useCallback((key: SortKey) => {
    setSortKey((prev) => {
      if (prev === key) {
        setSortDir((d) => (d === "asc" ? "desc" : "asc"));
        return prev;
      }
      setSortDir("desc");
      return key;
    });
    setPage(0);
  }, []);

  const filtered = useMemo(() => {
    if (!Array.isArray(drugs)) return [];
    const q = search.toLowerCase().trim();
    return drugs.filter(
      (d) =>
        !q ||
        d.name.toLowerCase().includes(q) ||
        d.genericName.toLowerCase().includes(q) ||
        d.topReaction.toLowerCase().includes(q)
    );
  }, [drugs, search]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      if (typeof av === "string" && typeof bv === "string") {
        return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
      }
      const an = Number(av);
      const bn = Number(bv);
      return sortDir === "asc" ? an - bn : bn - an;
    });
  }, [filtered, sortKey, sortDir]);

  const paged = useMemo(() => sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE), [sorted, page]);
  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);

  const columns: { key: SortKey; label: string; sortable: boolean }[] = [
    { key: "name", label: "Drug", sortable: true },
    { key: "totalReports", label: "Reports", sortable: true },
    { key: "riskScore", label: "Risk Score", sortable: true },
    { key: "interactionCount", label: "Interactions", sortable: true },
  ];

  return (
    <div className="bg-[#111111] border border-[#222222]">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-[#1a1a1a]">
        <div>
          <h3 className="text-sm font-medium text-white">Top Drugs by Adverse Events</h3>
          <p className="text-xs text-[#666666] mt-0.5">
            {isLoading ? "Loading…" : `${filtered.length} drugs monitored`}
          </p>
        </div>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#555555]" />
          <input
            type="text"
            placeholder="Filter drugs…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            className="bg-[#0d0d0d] border border-[#222222] text-xs text-white placeholder-[#444444] pl-8 pr-3 py-1.5 w-44 focus:outline-none focus:border-[#3D56F0] transition-colors"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="px-5 py-3">
          <TableSkeleton />
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[#1a1a1a]">
                  <th className="text-left px-5 py-2.5 text-[#555555] uppercase tracking-[0.05em] font-medium w-8">#</th>
                  {columns.map((col) => (
                    <th
                      key={col.key}
                      className={`text-left px-3 py-2.5 text-[#555555] uppercase tracking-[0.05em] font-medium ${col.sortable ? "cursor-pointer hover:text-[#a1a1a1] select-none" : ""}`}
                      onClick={col.sortable ? () => handleSort(col.key) : undefined}
                    >
                      <div className="flex items-center gap-1">
                        {col.label}
                        {col.sortable && <SortIcon column={col.key} sortKey={sortKey} sortDir={sortDir} />}
                      </div>
                    </th>
                  ))}
                  <th className="text-left px-3 py-2.5 text-[#555555] uppercase tracking-[0.05em] font-medium">Risk Tier</th>
                  <th className="text-left px-3 py-2.5 text-[#555555] uppercase tracking-[0.05em] font-medium">Top Reaction</th>
                </tr>
              </thead>
              <tbody>
                {paged.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-10 text-[#555555]">
                      No drugs match your filter
                    </td>
                  </tr>
                ) : (
                  paged.map((drug, idx) => (
                    <tr
                      key={drug.genericName}
                      className="border-b border-[#111111] hover:bg-[#0d0d0d] transition-colors group"
                    >
                      <td className="px-5 py-3 text-[#444444]">{page * PAGE_SIZE + idx + 1}</td>
                      <td className="px-3 py-3">
                        <div className="font-medium text-white group-hover:text-[#3D56F0] transition-colors">
                          {drug.name}
                        </div>
                        <div className="text-[#555555] text-[10px] mt-0.5">{drug.genericName}</div>
                      </td>
                      <td className="px-3 py-3 text-[#a1a1a1] font-mono">
                        {formatNumber(drug.totalReports)}
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-[#0d0d0d] h-1.5 rounded-full overflow-hidden w-16">
                            <div
                              className="h-full bg-[#3D56F0] rounded-full"
                              style={{ width: `${Math.min(100, drug.riskScore)}%` }}
                            />
                          </div>
                          <span className="text-[#a1a1a1] font-mono w-6 text-right">{drug.riskScore}</span>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-[#a1a1a1] font-mono">{drug.interactionCount}</td>
                      <td className="px-3 py-3">
                        <RiskBadge tier={drug.riskTier as RiskTier} />
                      </td>
                      <td className="px-3 py-3 text-[#666666] max-w-[140px] truncate" title={drug.topReaction}>
                        {drug.topReaction}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-3 border-t border-[#1a1a1a]">
              <span className="text-[10px] text-[#555555]">
                Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, sorted.length)} of {sorted.length}
              </span>
              <div className="flex gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="px-2.5 py-1 text-[10px] text-[#666666] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed border border-[#222222] hover:border-[#333333] transition-colors"
                >
                  Prev
                </button>
                {Array.from({ length: totalPages }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setPage(i)}
                    className={`px-2.5 py-1 text-[10px] border transition-colors ${
                      i === page
                        ? "bg-[#3D56F0] border-[#3D56F0] text-white"
                        : "border-[#222222] text-[#666666] hover:text-white hover:border-[#333333]"
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={page === totalPages - 1}
                  className="px-2.5 py-1 text-[10px] text-[#666666] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed border border-[#222222] hover:border-[#333333] transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
