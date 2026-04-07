// src/lib/api.ts
// Client-side API helpers — these call YOUR OWN /api/* routes only.
// External API calls (FDA, USDA, etc.) live in src/app/api route files.

import type {
  AdverseEventSummary,
  DrugSearchResult,
  DrugFoodInteraction,
  InteractionScore,
  DrugLabel,
  NutrientProfile,
  USDAFoodSearchResponse,
  FAERSCountResponse,
  DashboardStats,
  TimelineDataPoint,
  DemographicBreakdown,
} from "./types";
import { API_ROUTES } from "./constants";
import { buildQueryString } from "./utils";

// ============================================================
// Generic Fetch Wrapper
// ============================================================

export async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(errorBody?.error ?? `HTTP ${res.status}: ${res.statusText}`);
  }
  return res.json() as Promise<T>;
}

// ============================================================
// Adverse Events API
// ============================================================

export async function fetchAdverseEvents(params: {
  drug: string;
  limit?: number;
  skip?: number;
  serious?: boolean;
}): Promise<AdverseEventSummary> {
  const qs = buildQueryString({
    drug: params.drug,
    limit: params.limit ?? 25,
    skip: params.skip ?? 0,
    serious: params.serious,
  });
  return fetchJson<AdverseEventSummary>(`${API_ROUTES.ADVERSE_EVENTS}?${qs}`);
}

export async function fetchAdverseEventTimeline(params: {
  drug: string;
  months?: number;
}): Promise<TimelineDataPoint[]> {
  const qs = buildQueryString({ drug: params.drug, months: params.months ?? 24 });
  return fetchJson<TimelineDataPoint[]>(`${API_ROUTES.ADVERSE_EVENTS_TIMELINE}?${qs}`);
}

export async function fetchAdverseEventDemographics(params: {
  drug: string;
}): Promise<DemographicBreakdown> {
  const qs = buildQueryString({ drug: params.drug });
  return fetchJson<DemographicBreakdown>(`${API_ROUTES.ADVERSE_EVENTS_DEMOGRAPHICS}?${qs}`);
}

// ============================================================
// Food Data API
// ============================================================

export async function searchFoodData(params: {
  query: string;
  pageSize?: number;
  pageNumber?: number;
}): Promise<USDAFoodSearchResponse> {
  const qs = buildQueryString({
    q: params.query,
    pageSize: params.pageSize ?? 20,
    pageNumber: params.pageNumber ?? 1,
  });
  return fetchJson<USDAFoodSearchResponse>(`${API_ROUTES.FOOD_DATA_SEARCH}?${qs}`);
}

export async function fetchFoodNutrients(params: {
  fdcId: number;
}): Promise<NutrientProfile> {
  const qs = buildQueryString({ fdcId: params.fdcId });
  return fetchJson<NutrientProfile>(`${API_ROUTES.FOOD_DATA_NUTRIENTS}?${qs}`);
}

// ============================================================
// Drug Interactions API
// ============================================================

export async function fetchDrugInteractions(params: {
  drug: string;
}): Promise<InteractionScore> {
  const qs = buildQueryString({ drug: params.drug });
  return fetchJson<InteractionScore>(`${API_ROUTES.DRUG_INTERACTIONS}?${qs}`);
}

// ============================================================
// Drug Label API
// ============================================================

export async function fetchDrugLabel(params: {
  drug: string;
}): Promise<DrugLabel> {
  const qs = buildQueryString({ drug: params.drug });
  return fetchJson<DrugLabel>(`${API_ROUTES.DRUG_LABEL}?${qs}`);
}

// ============================================================
// Dashboard Stats (aggregated from adverse events)
// ============================================================

export async function fetchDashboardStats(): Promise<DashboardStats> {
  return fetchJson<DashboardStats>(`${API_ROUTES.ADVERSE_EVENTS}?mode=stats`);
}

// ============================================================
// Drug Search (uses adverse events count endpoint)
// ============================================================

export async function searchDrugs(params: {
  query: string;
  limit?: number;
}): Promise<DrugSearchResult[]> {
  const qs = buildQueryString({ drug: params.query, limit: params.limit ?? 10, mode: "search" });
  return fetchJson<DrugSearchResult[]>(`${API_ROUTES.ADVERSE_EVENTS}?${qs}`);
}

// ============================================================
// Top Reactions for a Drug
// ============================================================

export async function fetchTopReactions(params: {
  drug: string;
  limit?: number;
}): Promise<FAERSCountResponse> {
  const qs = buildQueryString({ drug: params.drug, limit: params.limit ?? 10, mode: "reactions" });
  return fetchJson<FAERSCountResponse>(`${API_ROUTES.ADVERSE_EVENTS}?${qs}`);
}

// ============================================================
// Drug-Food Interaction Matrix
// ============================================================

export async function fetchInteractionMatrix(params: {
  drugs: string[];
}): Promise<DrugFoodInteraction[]> {
  const qs = buildQueryString({ drugs: params.drugs.join(",") });
  return fetchJson<DrugFoodInteraction[]>(`${API_ROUTES.DRUG_INTERACTIONS}?${qs}`);
}
