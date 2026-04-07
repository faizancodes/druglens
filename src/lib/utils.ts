import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, parseISO, differenceInDays, isValid } from "date-fns";
import type { RiskTier } from "./types";
import { RISK_TIER_THRESHOLDS } from "./constants";

// ============================================================
// Class Name Utilities
// ============================================================

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

// ============================================================
// Date Formatters
// ============================================================

export function formatDate(dateStr: string, fmt = "MMM d, yyyy"): string {
  try {
    const date = parseISO(dateStr);
    if (!isValid(date)) return dateStr;
    return format(date, fmt);
  } catch {
    return dateStr;
  }
}

export function formatFAERSDate(dateStr: string): string {
  // FAERS dates are in YYYYMMDD format
  if (!dateStr || dateStr.length !== 8) return dateStr;
  try {
    const year = dateStr.slice(0, 4);
    const month = dateStr.slice(4, 6);
    const day = dateStr.slice(6, 8);
    const date = new Date(`${year}-${month}-${day}`);
    if (!isValid(date)) return dateStr;
    return format(date, "MMM d, yyyy");
  } catch {
    return dateStr;
  }
}

export function formatMonthYear(dateStr: string): string {
  try {
    const date = parseISO(dateStr);
    if (!isValid(date)) return dateStr;
    return format(date, "MMM yyyy");
  } catch {
    return dateStr;
  }
}

export function getDaysDifference(dateA: string, dateB: string): number {
  try {
    return differenceInDays(parseISO(dateA), parseISO(dateB));
  } catch {
    return 0;
  }
}

export function formatRelativeTime(dateStr: string): string {
  try {
    const date = parseISO(dateStr);
    if (!isValid(date)) return dateStr;
    const days = differenceInDays(new Date(), date);
    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    if (days < 7) return `${days} days ago`;
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
    if (days < 365) return `${Math.floor(days / 30)} months ago`;
    return `${Math.floor(days / 365)} years ago`;
  } catch {
    return dateStr;
  }
}

// ============================================================
// Number Formatters
// ============================================================

export function formatNumber(n: number): string {
  if (n == null) return "0";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

export function formatPercentage(value: number, decimals = 1): string {
  if (value == null) return "0%";
  return `${value.toFixed(decimals)}%`;
}

export function formatRiskScore(score: number): string {
  if (score == null) return "0";
  return Math.round(score).toString();
}

// ============================================================
// Risk Score Calculators
// ============================================================

export function calculateRiskTier(score: number): RiskTier {
  if (score >= RISK_TIER_THRESHOLDS.critical.min) return "critical";
  if (score >= RISK_TIER_THRESHOLDS.high.min) return "high";
  if (score >= RISK_TIER_THRESHOLDS.moderate.min) return "moderate";
  if (score >= RISK_TIER_THRESHOLDS.low.min) return "low";
  return "minimal";
}

export function getRiskTierColor(tier: RiskTier): string {
  return RISK_TIER_THRESHOLDS[tier]?.color ?? "#666666";
}

export function getRiskTierLabel(tier: RiskTier): string {
  return RISK_TIER_THRESHOLDS[tier]?.label ?? "Unknown";
}

export function calculateInteractionRiskScore(params: {
  seriousnessRatio: number;
  deathRatio: number;
  totalReports: number;
  interactionCount: number;
  evidenceLevel: "A" | "B" | "C" | "D";
}): number {
  const { seriousnessRatio, deathRatio, totalReports, interactionCount, evidenceLevel } = params;

  const evidenceWeights = { A: 1.0, B: 0.8, C: 0.6, D: 0.4 };
  const evidenceWeight = evidenceWeights[evidenceLevel] ?? 0.5;

  // Normalize total reports (log scale, cap at 100K)
  const reportScore = Math.min(Math.log10(Math.max(totalReports, 1)) / 5, 1) * 20;

  // Seriousness contributes up to 40 points
  const seriousnessScore = seriousnessRatio * 40;

  // Death ratio contributes up to 20 points
  const deathScore = deathRatio * 20;

  // Interaction count contributes up to 20 points
  const interactionScore = Math.min(interactionCount / 10, 1) * 20;

  const rawScore = (reportScore + seriousnessScore + deathScore + interactionScore) * evidenceWeight;
  return Math.min(Math.round(rawScore), 100);
}

export function normalizeHeatmapValue(value: number, min: number, max: number): number {
  if (max === min) return 0;
  return (value - min) / (max - min);
}

// ============================================================
// String Utilities
// ============================================================

export function truncate(str: string, maxLength: number): string {
  if (!str) return "";
  if (str.length <= maxLength) return str;
  return `${str.slice(0, maxLength - 3)}...`;
}

export function capitalize(str: string): string {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

export function titleCase(str: string): string {
  if (!str) return "";
  return str
    .toLowerCase()
    .split(" ")
    .map((word) => capitalize(word))
    .join(" ");
}

export function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function normalizeDrugName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}

// ============================================================
// Array Utilities
// ============================================================

export function groupBy<T>(arr: T[], key: keyof T): Record<string, T[]> {
  return arr.reduce(
    (acc, item) => {
      const groupKey = String(item[key]);
      if (!acc[groupKey]) acc[groupKey] = [];
      acc[groupKey].push(item);
      return acc;
    },
    {} as Record<string, T[]>
  );
}

export function sortByKey<T>(arr: T[], key: keyof T, order: "asc" | "desc" = "asc"): T[] {
  return [...arr].sort((a, b) => {
    const aVal = a[key];
    const bVal = b[key];
    if (aVal < bVal) return order === "asc" ? -1 : 1;
    if (aVal > bVal) return order === "asc" ? 1 : -1;
    return 0;
  });
}

export function uniqueBy<T>(arr: T[], key: keyof T): T[] {
  const seen = new Set<unknown>();
  return arr.filter((item) => {
    const val = item[key];
    if (seen.has(val)) return false;
    seen.add(val);
    return true;
  });
}

export function chunkArray<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

// ============================================================
// URL Utilities
// ============================================================

export function buildQueryString(params: Record<string, string | number | boolean | undefined>): string {
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") {
      searchParams.set(key, String(value));
    }
  }
  return searchParams.toString();
}

// ============================================================
// Color Utilities
// ============================================================

export function hexToRgba(hex: string, alpha: number): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return `rgba(0,0,0,${alpha})`;
  const r = parseInt(result[1], 16);
  const g = parseInt(result[2], 16);
  const b = parseInt(result[3], 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

export function interpolateColor(color1: string, color2: string, factor: number): string {
  const r1 = parseInt(color1.slice(1, 3), 16);
  const g1 = parseInt(color1.slice(3, 5), 16);
  const b1 = parseInt(color1.slice(5, 7), 16);
  const r2 = parseInt(color2.slice(1, 3), 16);
  const g2 = parseInt(color2.slice(3, 5), 16);
  const b2 = parseInt(color2.slice(5, 7), 16);
  const r = Math.round(r1 + (r2 - r1) * factor);
  const g = Math.round(g1 + (g2 - g1) * factor);
  const b = Math.round(b1 + (b2 - b1) * factor);
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}
