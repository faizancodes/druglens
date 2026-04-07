"use client";

import { useState, useMemo, useCallback } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
  createColumnHelper,
  type SortingState,
  type VisibilityState,
} from "@tanstack/react-table";
import {
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  Download,
  Eye,
  EyeOff,
  ChevronLeft,
  ChevronRight,
  Salad,
  AlertTriangle,
} from "lucide-react";
import { RiskBadge } from "@/components/ui/Badge";
import { cn, formatNumber, formatPercentage, calculateRiskTier } from "@/lib/utils";
import type { RiskTier } from "@/lib/types";

export interface DrugRow {
  name: string;
  genericName: string;
  totalReports: number;
  riskScore: number;
  riskTier: RiskTier | string;
  topReaction: string;
  interactionCount: number;
  seriousPercent: number;
  fatalityPercent: number;
  foodInteractionFlag: boolean;
}

const columnHelper = createColumnHelper<DrugRow>();

const ALL_COLUMNS = [
  "name",
  "totalReports",
  "riskTier",
  "seriousPercent",
  "fatalityPercent",
  "topReaction",
  "interactionCount",
  "foodInteractionFlag",
];

interface ResultsTableProps {
  data: DrugRow[];
  isLoading: boolean;
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onSortChange: (sortBy: string, sortOrder: "asc" | "desc") => void;
}

function SortIcon({ sorted }: { sorted: false | "asc" | "desc" }) {
  if (sorted === "asc") return <ChevronUp className="w-3 h-3 text-[#00C9A7]" />;
  if (sorted === "desc") return <ChevronDown className="w-3 h-3 text-[#00C9A7]" />;
  return <ChevronsUpDown className="w-3 h-3 text-[#444444]" />;
}

function exportToCSV(data: DrugRow[]) {
  const headers = [
    "Drug Name",
    "Generic Name",
    "Total Reports",
    "Risk Score",
    "Risk Tier",
    "Serious %",
    "Fatality %",
    "Top Reaction",
    "Interaction Count",
    "Food Interaction Flag",
  ];
  const rows = data.map((d) => [
    d.name,
    d.genericName,
    d.totalReports,
    d.riskScore,
    d.riskTier,
    d.seriousPercent.toFixed(1),
    d.fatalityPercent.toFixed(1),
    d.topReaction,
    d.interactionCount,
    d.foodInteractionFlag ? "Yes" : "No",
  ]);
  const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "druglens-export.csv";
  a.click();
  URL.revokeObjectURL(url);
}

export function ResultsTable({
  data,
  isLoading,
  total,
  page,
  pageSize,
  totalPages,
  onPageChange,
  onSortChange,
}: ResultsTableProps) {
  const [sorting, setSorting] = useState<SortingState>([{ id: "totalReports", desc: true }]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [showColumnToggle, setShowColumnToggle] = useState(false);

  const columns = useMemo(
    () => [
      columnHelper.accessor("name", {
        header: "Drug Name",
        cell: (info) => (
          <div>
            <p className="text-sm font-semibold text-white capitalize">{info.getValue()}</p>
            <p className="text-[10px] text-[#555555] mt-0.5 capitalize">{info.row.original.genericName}</p>
          </div>
        ),
      }),
      columnHelper.accessor("totalReports", {
        header: "Total Reports",
        cell: (info) => (
          <span className="text-sm font-semibold text-white tabular-nums">
            {formatNumber(info.getValue())}
          </span>
        ),
      }),
      columnHelper.accessor("riskTier", {
        header: "Risk Tier",
        cell: (info) => {
          const tier = info.getValue() as RiskTier;
          return <RiskBadge tier={tier} />;
        },
      }),
      columnHelper.accessor("seriousPercent", {
        header: "Serious %",
        cell: (info) => {
          const val = info.getValue();
          return (
            <span
              className={cn(
                "text-sm font-semibold tabular-nums",
                val >= 60 ? "text-[#ef4444]" : val >= 40 ? "text-[#f59e0b]" : "text-[#22c55e]"
              )}
            >
              {formatPercentage(val)}
            </span>
          );
        },
      }),
      columnHelper.accessor("fatalityPercent", {
        header: "Fatality %",
        cell: (info) => {
          const val = info.getValue();
          return (
            <span
              className={cn(
                "text-sm tabular-nums",
                val >= 10 ? "text-[#ef4444]" : val >= 5 ? "text-[#f59e0b]" : "text-[#a1a1a1]"
              )}
            >
              {formatPercentage(val)}
            </span>
          );
        },
      }),
      columnHelper.accessor("topReaction", {
        header: "Top Reaction",
        cell: (info) => (
          <span className="text-xs text-[#a1a1a1]">{info.getValue()}</span>
        ),
      }),
      columnHelper.accessor("interactionCount", {
        header: "Interactions",
        cell: (info) => {
          const count = info.getValue();
          return (
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-semibold text-white tabular-nums">{count}</span>
              {count > 5 && <AlertTriangle className="w-3 h-3 text-[#f59e0b]" />}
            </div>
          );
        },
      }),
      columnHelper.accessor("foodInteractionFlag", {
        header: "Food Risk",
        cell: (info) =>
          info.getValue() ? (
            <div className="flex items-center gap-1 text-[#f59e0b]">
              <Salad className="w-3.5 h-3.5" />
              <span className="text-[10px] font-semibold uppercase tracking-wide">Yes</span>
            </div>
          ) : (
            <span className="text-[10px] text-[#444444]">—</span>
          ),
      }),
    ],
    []
  );

  const table = useReactTable({
    data,
    columns,
    state: { sorting, columnVisibility },
    onSortingChange: (updater) => {
      const next = typeof updater === "function" ? updater(sorting) : updater;
      setSorting(next);
      if (next.length > 0) {
        const { id, desc } = next[0];
        const sortByMap: Record<string, string> = {
          totalReports: "reports",
          riskTier: "risk",
          name: "name",
        };
        onSortChange(sortByMap[id] ?? "reports", desc ? "desc" : "asc");
      }
    },
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    manualPagination: true,
    pageCount: totalPages,
  });

  const handleExport = useCallback(() => {
    exportToCSV(data);
  }, [data]);

  const safeData = Array.isArray(data) ? data : [];

  return (
    <div className="bg-[#111111] border border-[#222222]">
      {/* Table toolbar */}
      <div className="px-5 py-4 border-b border-[#222222] flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-[0.05em] text-[#a1a1a1]">
            Results
          </h2>
          <p className="text-[10px] text-[#555555] mt-0.5">
            {isLoading ? "Loading..." : `${formatNumber(total)} drugs found`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Column visibility toggle */}
          <div className="relative">
            <button
              onClick={() => setShowColumnToggle((v) => !v)}
              className="flex items-center gap-1.5 text-[10px] text-[#555555] hover:text-[#a1a1a1] border border-[#222222] px-3 py-1.5 transition-colors"
            >
              <Eye className="w-3 h-3" />
              Columns
            </button>
            {showColumnToggle && (
              <div className="absolute right-0 top-full mt-1 z-50 bg-[#111111] border border-[#333333] shadow-2xl p-3 min-w-[160px]">
                <p className="text-[9px] uppercase tracking-wide text-[#444444] font-semibold mb-2">
                  Toggle Columns
                </p>
                {table.getAllLeafColumns().map((col) => (
                  <label
                    key={col.id}
                    className="flex items-center gap-2 py-1 cursor-pointer group"
                  >
                    <input
                      type="checkbox"
                      checked={col.getIsVisible()}
                      onChange={col.getToggleVisibilityHandler()}
                      className="accent-[#00C9A7]"
                    />
                    <span className="text-xs text-[#666666] group-hover:text-[#a1a1a1] transition-colors capitalize">
                      {col.id}
                    </span>
                    {col.getIsVisible() ? (
                      <Eye className="w-3 h-3 text-[#444444] ml-auto" />
                    ) : (
                      <EyeOff className="w-3 h-3 text-[#333333] ml-auto" />
                    )}
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* CSV Export */}
          <button
            onClick={handleExport}
            disabled={safeData.length === 0}
            className="flex items-center gap-1.5 text-[10px] text-[#555555] hover:text-[#00C9A7] border border-[#222222] hover:border-[#00C9A7]/30 px-3 py-1.5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Download className="w-3 h-3" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="border-b border-[#1a1a1a] bg-[#0f0f0f]">
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-4 py-3 text-left"
                    style={{ width: header.getSize() }}
                  >
                    {header.isPlaceholder ? null : (
                      <button
                        className={cn(
                          "flex items-center gap-1.5 text-[9px] uppercase tracking-[0.1em] font-semibold transition-colors",
                          header.column.getCanSort()
                            ? "cursor-pointer text-[#555555] hover:text-[#a1a1a1]"
                            : "cursor-default text-[#444444]"
                        )}
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {header.column.getCanSort() && (
                          <SortIcon sorted={header.column.getIsSorted()} />
                        )}
                      </button>
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {isLoading ? (
              // Skeleton rows
              Array.from({ length: 8 }).map((_, i) => (
                <tr key={i} className="border-b border-[#1a1a1a] animate-pulse">
                  {columns.map((_, j) => (
                    <td key={j} className="px-4 py-3">
                      <div
                        className="h-4 bg-[#1a1a1a] rounded"
                        style={{ width: `${60 + Math.random() * 40}%` }}
                      />
                    </td>
                  ))}
                </tr>
              ))
            ) : safeData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-16 text-center">
                  <p className="text-sm text-[#555555]">No results found</p>
                  <p className="text-xs text-[#444444] mt-1">Try a different search term or adjust filters</p>
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-[#1a1a1a] hover:bg-[#0f0f0f] transition-colors"
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-4 py-3">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {!isLoading && totalPages > 1 && (
        <div className="px-5 py-4 border-t border-[#1a1a1a] flex items-center justify-between">
          <p className="text-[10px] text-[#555555]">
            Page {page} of {totalPages} · {formatNumber(total)} total
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
              className="p-1.5 border border-[#222222] text-[#555555] hover:text-[#a1a1a1] hover:border-[#333333] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            {/* Page numbers */}
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const pageNum = Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
              return (
                <button
                  key={pageNum}
                  onClick={() => onPageChange(pageNum)}
                  className={cn(
                    "w-7 h-7 text-[10px] border transition-colors",
                    pageNum === page
                      ? "bg-[#00C9A7]/10 border-[#00C9A7]/40 text-[#00C9A7] font-semibold"
                      : "border-[#222222] text-[#555555] hover:text-[#a1a1a1] hover:border-[#333333]"
                  )}
                >
                  {pageNum}
                </button>
              );
            })}
            <button
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages}
              className="p-1.5 border border-[#222222] text-[#555555] hover:text-[#a1a1a1] hover:border-[#333333] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
