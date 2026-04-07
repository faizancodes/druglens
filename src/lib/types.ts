// ============================================================
// FDA FAERS (Adverse Event Reporting System) Types
// ============================================================

export interface FAERSAdverseEvent {
  safetyreportid: string;
  receivedate: string;
  serious: string;
  seriousnessdeath: string;
  seriousnesshospitalization: string;
  seriousnesslifethreatening: string;
  seriousnessdisabling: string;
  patient: FAERSPatient;
  primarysource: FAERSPrimarySource;
  reportduplicate: string;
}

export interface FAERSPatient {
  patientonsetage: string;
  patientonsetageunit: string;
  patientsex: string;
  patientweight: string;
  reaction: FAERSReaction[];
  drug: FAERSDrug[];
}

export interface FAERSReaction {
  reactionmeddrapt: string;
  reactionoutcome: string;
}

export interface FAERSDrug {
  medicinalproduct: string;
  drugindication: string;
  drugadministrationroute: string;
  drugdosagetext: string;
  drugcharacterization: string;
  activesubstance: { activesubstancename: string };
}

export interface FAERSPrimarySource {
  reportercountry: string;
  qualification: string;
}

export interface FAERSSearchResponse {
  meta: FAERSMeta;
  results: FAERSAdverseEvent[];
}

export interface FAERSMeta {
  disclaimer: string;
  terms: string;
  license: string;
  last_updated: string;
  results: {
    skip: number;
    limit: number;
    total: number;
  };
}

export interface FAERSCountResult {
  term: string;
  count: number;
}

export interface FAERSCountResponse {
  meta: FAERSMeta;
  results: FAERSCountResult[];
}

// ============================================================
// USDA FoodData Central Types
// ============================================================

export interface USDAFoodSearchResponse {
  totalHits: number;
  currentPage: number;
  totalPages: number;
  foods: USDAFood[];
}

export interface USDAFood {
  fdcId: number;
  description: string;
  dataType: string;
  gtinUpc: string;
  publishedDate: string;
  brandOwner: string;
  ingredients: string;
  marketCountry: string;
  foodCategory: string;
  allHighlightFields: string;
  score: number;
  foodNutrients: USDAFoodNutrient[];
}

export interface USDAFoodNutrient {
  nutrientId: number;
  nutrientName: string;
  nutrientNumber: string;
  unitName: string;
  derivationCode: string;
  derivationDescription: string;
  value: number;
}

export interface USDANutrientDetail {
  id: number;
  number: string;
  name: string;
  rank: number;
  unitName: string;
}

export interface USDAFoodDetail {
  fdcId: number;
  description: string;
  dataType: string;
  publicationDate: string;
  foodNutrients: USDAFoodNutrientDetail[];
  foodCategory: { description: string };
  ingredients: string;
}

export interface USDAFoodNutrientDetail {
  id: number;
  amount: number;
  nutrient: USDANutrientDetail;
}

// ============================================================
// Open Food Facts Types
// ============================================================

export interface OFFProduct {
  _id: string;
  product_name: string;
  brands: string;
  categories: string;
  ingredients_text: string;
  nutriments: OFFNutriments;
  allergens: string;
  additives_tags: string[];
  labels: string;
  countries: string;
  image_url: string;
  nutriscore_grade: string;
}

export interface OFFNutriments {
  energy_kcal: number;
  proteins: number;
  carbohydrates: number;
  fat: number;
  fiber: number;
  sodium: number;
  sugars: number;
  "vitamin-c": number;
  "vitamin-k": number;
  calcium: number;
  iron: number;
}

export interface OFFSearchResponse {
  count: number;
  page: number;
  page_count: number;
  page_size: number;
  products: OFFProduct[];
  skip: number;
}

// ============================================================
// Drug-Food Interaction Types
// ============================================================

export type RiskTier = "critical" | "high" | "moderate" | "low" | "minimal";

export interface InteractionCompound {
  name: string;
  category: string;
  mechanism: string;
  affectedDrugs: string[];
  riskTier: RiskTier;
  description: string;
  foodSources: string[];
}

export interface DrugFoodInteraction {
  drugName: string;
  compound: string;
  compoundCategory: string;
  mechanism: string;
  riskTier: RiskTier;
  riskScore: number;
  description: string;
  clinicalSignificance: string;
  managementStrategy: string;
  evidenceLevel: "A" | "B" | "C" | "D";
  foodsToAvoid: string[];
  foodsToMonitor: string[];
}

export interface InteractionScore {
  drugName: string;
  overallRiskScore: number;
  riskTier: RiskTier;
  interactions: DrugFoodInteraction[];
  topCompounds: string[];
  affectedFoodCategories: string[];
  calculatedAt: string;
}

// ============================================================
// Adverse Event Analysis Types
// ============================================================

export interface AdverseEventSummary {
  drugName: string;
  totalReports: number;
  seriousReports: number;
  deathReports: number;
  hospitalizationReports: number;
  topReactions: ReactionCount[];
  demographicBreakdown: DemographicBreakdown;
  timelineData: TimelineDataPoint[];
}

export interface ReactionCount {
  reaction: string;
  count: number;
  percentage: number;
}

export interface DemographicBreakdown {
  bySex: { male: number; female: number; unknown: number };
  byAgeGroup: AgeGroupCount[];
  byCountry: CountryCount[];
  byOutcome: OutcomeCount[];
}

export interface AgeGroupCount {
  ageGroup: string;
  count: number;
  percentage: number;
}

export interface CountryCount {
  country: string;
  count: number;
}

export interface OutcomeCount {
  outcome: string;
  count: number;
}

export interface TimelineDataPoint {
  date: string;
  count: number;
  seriousCount: number;
  month: string;
  year: number;
}

// ============================================================
// Demographic Cohort Types
// ============================================================

export interface DemographicCohort {
  id: string;
  label: string;
  sexFilter: "male" | "female" | "all";
  ageMin: number;
  ageMax: number;
  countries: string[];
}

export interface CohortAnalysis {
  cohort: DemographicCohort;
  totalReports: number;
  topReactions: ReactionCount[];
  riskScore: number;
  comparedToBaseline: number;
}

// ============================================================
// Nutrient Profile Types
// ============================================================

export interface NutrientProfile {
  foodId: string;
  foodName: string;
  category: string;
  nutrients: NutrientValue[];
  interactionRiskCompounds: CompoundPresence[];
  overallRiskScore: number;
}

export interface NutrientValue {
  nutrientId: number;
  name: string;
  amount: number;
  unit: string;
  percentDailyValue: number;
}

export interface CompoundPresence {
  compound: string;
  estimatedLevel: "high" | "medium" | "low" | "trace";
  relevantNutrients: string[];
}

// ============================================================
// Drug Label Types (OpenFDA Drug Label API)
// ============================================================

export interface DrugLabel {
  id: string;
  setId: string;
  version: string;
  effectiveTime: string;
  openfda: OpenFDAMeta;
  indicationsAndUsage: string[];
  warningsAndPrecautions: string[];
  adverseReactions: string[];
  drugInteractions: string[];
  contraindications: string[];
  dosageAndAdministration: string[];
  description: string[];
  clinicalPharmacology: string[];
  mechanismOfAction: string[];
}

export interface OpenFDAMeta {
  applicationNumber: string[];
  brandName: string[];
  genericName: string[];
  manufacturerName: string[];
  productNdc: string[];
  productType: string[];
  route: string[];
  substanceName: string[];
  rxcui: string[];
  spl_id: string[];
}

export interface DrugLabelSearchResponse {
  meta: FAERSMeta;
  results: DrugLabelRaw[];
}

export interface DrugLabelRaw {
  id: string;
  set_id: string;
  version: string;
  effective_time: string;
  openfda: {
    application_number?: string[];
    brand_name?: string[];
    generic_name?: string[];
    manufacturer_name?: string[];
    product_ndc?: string[];
    product_type?: string[];
    route?: string[];
    substance_name?: string[];
    rxcui?: string[];
    spl_id?: string[];
  };
  indications_and_usage?: string[];
  warnings_and_precautions?: string[];
  adverse_reactions?: string[];
  drug_interactions?: string[];
  contraindications?: string[];
  dosage_and_administration?: string[];
  description?: string[];
  clinical_pharmacology?: string[];
  mechanism_of_action?: string[];
}

// ============================================================
// Dashboard & UI State Types
// ============================================================

export interface DashboardStats {
  totalDrugsMonitored: number;
  totalAdverseEvents: number;
  criticalInteractions: number;
  activeAlerts: number;
  lastUpdated: string;
}

export interface DrugSearchResult {
  name: string;
  genericName: string;
  totalReports: number;
  riskScore: number;
  riskTier: RiskTier;
  topReaction: string;
  interactionCount: number;
}

export interface Alert {
  id: string;
  drugName: string;
  alertType: "spike" | "new_interaction" | "demographic_shift" | "label_update";
  severity: RiskTier;
  message: string;
  timestamp: string;
  isRead: boolean;
}

export interface HeatmapCell {
  drug: string;
  reaction: string;
  count: number;
  normalizedScore: number;
}

export interface ComparisonData {
  drugs: string[];
  reactions: string[];
  matrix: HeatmapCell[][];
  interactionOverlap: string[];
}

// ============================================================
// Filter & Search State Types
// ============================================================

export interface DrugFilterState {
  searchQuery: string;
  riskTierFilter: RiskTier | "all";
  dateRange: { start: string; end: string };
  demographicCohort: DemographicCohort | null;
  reactionFilter: string[];
  countryFilter: string[];
  seriousnessFilter: "all" | "serious" | "non-serious";
  sortBy: "reports" | "risk" | "name" | "date";
  sortOrder: "asc" | "desc";
  page: number;
  pageSize: number;
}

export interface FoodFilterState {
  searchQuery: string;
  categoryFilter: string[];
  compoundFilter: string[];
  riskTierFilter: RiskTier | "all";
  nutrientFilter: string[];
}

// ============================================================
// Component Prop Types
// ============================================================

export interface CardProps {
  title?: string;
  description?: string;
  className?: string;
  children?: React.ReactNode;
  padding?: boolean;
  hoverable?: boolean;
  onClick?: () => void;
}

export interface BadgeProps {
  label: string;
  variant?: "default" | "success" | "warning" | "error" | "info" | "accent";
  size?: "sm" | "md";
  className?: string;
}

export interface ButtonProps {
  label?: string;
  children?: React.ReactNode;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  isLoading?: boolean;
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
  className?: string;
  icon?: React.ReactNode;
}

export interface LoadingStateProps {
  message?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export interface ErrorStateProps {
  message?: string;
  title?: string;
  onRetry?: () => void;
  className?: string;
}

export interface EmptyStateProps {
  title?: string;
  description?: string;
  message?: string;
  icon?: React.ReactNode;
  className?: string;
  children?: React.ReactNode;
  action?: { label: string; onClick: () => void };
}

export interface SkeletonProps {
  className?: string;
  width?: string;
  height?: string;
  lines?: number;
}

export interface TooltipProps {
  content: string | React.ReactNode;
  children: React.ReactNode;
  position?: "top" | "bottom" | "left" | "right";
  className?: string;
}

// ============================================================
// API Response Wrapper Types
// ============================================================

export interface ApiResponse<T> {
  data: T;
  error: string | null;
  status: number;
  _fallback?: boolean;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ============================================================
// Store Types
// ============================================================

export interface AppState {
  sidebarOpen: boolean;
  activeSection: string;
  alerts: Alert[];
  dashboardStats: DashboardStats | null;
  isInitialized: boolean;
  setSidebarOpen: (open: boolean) => void;
  setActiveSection: (section: string) => void;
  setAlerts: (alerts: Alert[]) => void;
  setDashboardStats: (stats: DashboardStats) => void;
  markAlertRead: (id: string) => void;
  setInitialized: (initialized: boolean) => void;
}

export interface DrugState {
  selectedDrug: string | null;
  comparedDrugs: string[];
  drugHistory: string[];
  adverseEventSummary: AdverseEventSummary | null;
  interactionScore: InteractionScore | null;
  drugLabel: DrugLabel | null;
  isLoadingDrug: boolean;
  setSelectedDrug: (drug: string | null) => void;
  addComparedDrug: (drug: string) => void;
  removeComparedDrug: (drug: string) => void;
  clearComparedDrugs: () => void;
  setAdverseEventSummary: (summary: AdverseEventSummary | null) => void;
  setInteractionScore: (score: InteractionScore | null) => void;
  setDrugLabel: (label: DrugLabel | null) => void;
  setIsLoadingDrug: (loading: boolean) => void;
}

export interface FilterState {
  drugFilters: DrugFilterState;
  foodFilters: FoodFilterState;
  setDrugFilter: <K extends keyof DrugFilterState>(key: K, value: DrugFilterState[K]) => void;
  setFoodFilter: <K extends keyof FoodFilterState>(key: K, value: FoodFilterState[K]) => void;
  resetDrugFilters: () => void;
  resetFoodFilters: () => void;
}
