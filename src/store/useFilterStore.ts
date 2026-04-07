"use client";

import { create } from "zustand";
import type { FilterState, DrugFilterState, FoodFilterState } from "@/lib/types";

const DEFAULT_DRUG_FILTERS: DrugFilterState = {
  searchQuery: "",
  riskTierFilter: "all",
  dateRange: {
    start: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    end: new Date().toISOString().slice(0, 10),
  },
  demographicCohort: null,
  reactionFilter: [],
  countryFilter: [],
  seriousnessFilter: "all",
  sortBy: "reports",
  sortOrder: "desc",
  page: 1,
  pageSize: 20,
};

const DEFAULT_FOOD_FILTERS: FoodFilterState = {
  searchQuery: "",
  categoryFilter: [],
  compoundFilter: [],
  riskTierFilter: "all",
  nutrientFilter: [],
};

export const useFilterStore = create<FilterState>((set) => ({
  drugFilters: DEFAULT_DRUG_FILTERS,
  foodFilters: DEFAULT_FOOD_FILTERS,

  setDrugFilter: (key, value) =>
    set((state) => ({
      drugFilters: { ...state.drugFilters, [key]: value },
    })),

  setFoodFilter: (key, value) =>
    set((state) => ({
      foodFilters: { ...state.foodFilters, [key]: value },
    })),

  resetDrugFilters: () =>
    set({ drugFilters: DEFAULT_DRUG_FILTERS }),

  resetFoodFilters: () =>
    set({ foodFilters: DEFAULT_FOOD_FILTERS }),
}));
