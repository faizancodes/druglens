"use client";

import { motion } from "framer-motion";
import {
  AlertTriangle,
  Activity,
  Pill,
  TrendingUp,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { RiskBadge } from "@/components/ui/Badge";
import type { RiskTier } from "@/lib/types";
import { formatNumber, calculateRiskTier } from "@/lib/utils";

interface DrugDetailHeaderProps {
  drugName: string;
  brandName?: string;
  genericName?: string;
  manufacturer?: string;
  productType?: string;
  totalReports: number;
  seriousReports: number;
  deathReports: number;
  hospitalizationReports: number;
  isLoading?: boolean;
}

function StatBox({
  label,
  value,
  color,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  color: string;
  icon: React.ElementType;
}) {
  return (
    <div className="flex flex-col gap-1 p-4 bg-[#111] border border-[#222]">
      <div className="flex items-center gap-2">
        <Icon className={`w-3.5 h-3.5 ${color}`} />
        <span className="text-[10px] font-semibold uppercase tracking-widest text-[#666]">
          {label}
        </span>
      </div>
      <span className={`text-2xl font-light ${color}`}>
        {typeof value === "number" ? formatNumber(value) : value}
      </span>
    </div>
  );
}

export function DrugDetailHeader({
  drugName,
  brandName,
  genericName,
  manufacturer,
  productType,
  totalReports,
  seriousReports,
  deathReports,
  hospitalizationReports,
  isLoading = false,
}: DrugDetailHeaderProps) {
  const riskTier: RiskTier = calculateRiskTier(
    totalReports > 0 ? seriousReports / totalReports : 0
  );

  const seriousRate =
    totalReports > 0
      ? ((seriousReports / totalReports) * 100).toFixed(1)
      : "0.0";

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-4 w-48 bg-[#1a1a1a] rounded" />
        <div className="h-10 w-72 bg-[#1a1a1a] rounded" />
        <div className="h-4 w-96 bg-[#1a1a1a] rounded" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-20 bg-[#111] border border-[#1a1a1a]" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-5"
    >
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs text-[#666]">
        <Link
          href="/"
          className="hover:text-[#a1a1a1] transition-colors"
        >
          Dashboard
        </Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-[#a1a1a1]">Drug Detail</span>
        <ChevronRight className="w-3 h-3" />
        <span className="text-white font-medium uppercase tracking-wide">
          {drugName}
        </span>
      </nav>

      {/* Title row */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#00C9A7]/10 border border-[#00C9A7]/20 flex items-center justify-center">
              <Pill className="w-4 h-4 text-[#00C9A7]" />
            </div>
            <h1 className="text-3xl font-light text-white tracking-tight uppercase">
              {drugName}
            </h1>
            <RiskBadge tier={riskTier} />
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-[#666]">
            {brandName && (
              <span>
                <span className="text-[#555] text-xs uppercase tracking-wider mr-1">
                  Brand:
                </span>
                <span className="text-[#a1a1a1]">{brandName}</span>
              </span>
            )}
            {genericName && genericName !== brandName && (
              <span>
                <span className="text-[#555] text-xs uppercase tracking-wider mr-1">
                  Generic:
                </span>
                <span className="text-[#a1a1a1]">{genericName}</span>
              </span>
            )}
            {manufacturer && (
              <span>
                <span className="text-[#555] text-xs uppercase tracking-wider mr-1">
                  Mfr:
                </span>
                <span className="text-[#a1a1a1]">{manufacturer}</span>
              </span>
            )}
            {productType && (
              <span className="text-[10px] font-semibold uppercase tracking-widest text-[#555] border border-[#222] px-2 py-0.5">
                {productType}
              </span>
            )}
          </div>
        </div>

        {/* Serious rate pill */}
        <div className="flex items-center gap-2 px-4 py-2 bg-[#111] border border-[#222] self-start">
          <TrendingUp className="w-4 h-4 text-[#f59e0b]" />
          <div>
            <div className="text-xs text-[#666] uppercase tracking-wider">
              Serious Rate
            </div>
            <div className="text-lg font-light text-[#f59e0b]">
              {seriousRate}%
            </div>
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatBox
          label="Total Reports"
          value={totalReports}
          color="text-white"
          icon={Activity}
        />
        <StatBox
          label="Serious Events"
          value={seriousReports}
          color="text-[#f59e0b]"
          icon={AlertTriangle}
        />
        <StatBox
          label="Deaths"
          value={deathReports}
          color="text-[#ef4444]"
          icon={AlertTriangle}
        />
        <StatBox
          label="Hospitalizations"
          value={hospitalizationReports}
          color="text-[#3D56F0]"
          icon={Activity}
        />
      </div>
    </motion.div>
  );
}
