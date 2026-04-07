// ============================================================
// API Base URLs
// ============================================================

export const FDA_ADVERSE_EVENTS_BASE_URL =
  "https://api.fda.gov/drug/event.json";

export const FDA_DRUG_LABEL_BASE_URL =
  "https://api.fda.gov/drug/label.json";

export const USDA_FOOD_DATA_BASE_URL =
  "https://api.nal.usda.gov/fdc/v1";

export const USDA_API_KEY = "DEMO_KEY";

export const OPEN_FOOD_FACTS_BASE_URL =
  "https://world.openfoodfacts.org/api/v2";

// ============================================================
// Internal API Routes
// ============================================================

export const API_ROUTES = {
  ADVERSE_EVENTS: "/api/adverse-events",
  ADVERSE_EVENTS_TIMELINE: "/api/adverse-events/timeline",
  ADVERSE_EVENTS_DEMOGRAPHICS: "/api/adverse-events/demographics",
  FOOD_DATA_SEARCH: "/api/food-data/search",
  FOOD_DATA_NUTRIENTS: "/api/food-data/nutrients",
  DRUG_INTERACTIONS: "/api/drug-interactions",
  DRUG_LABEL: "/api/drug-label",
} as const;

// ============================================================
// Known Food-Drug Interaction Compounds
// ============================================================

export const INTERACTION_COMPOUNDS = [
  {
    name: "Tyramine",
    category: "Biogenic Amine",
    mechanism: "MAO inhibition — tyramine accumulation causes hypertensive crisis",
    affectedDrugs: ["phenelzine", "tranylcypromine", "selegiline", "linezolid", "moclobemide"],
    riskTier: "critical" as const,
    description:
      "Tyramine is normally metabolized by monoamine oxidase (MAO). When MAO is inhibited, dietary tyramine can cause severe hypertensive crisis.",
    foodSources: [
      "aged cheese",
      "cured meats",
      "fermented foods",
      "red wine",
      "soy sauce",
      "miso",
      "tap beer",
    ],
  },
  {
    name: "Furanocoumarins",
    category: "Phytochemical",
    mechanism: "CYP3A4 inhibition — increases bioavailability of CYP3A4-metabolized drugs",
    affectedDrugs: [
      "simvastatin",
      "atorvastatin",
      "cyclosporine",
      "tacrolimus",
      "felodipine",
      "nifedipine",
      "midazolam",
      "triazolam",
      "sildenafil",
      "warfarin",
    ],
    riskTier: "high" as const,
    description:
      "Furanocoumarins in grapefruit irreversibly inhibit intestinal CYP3A4, dramatically increasing plasma concentrations of many drugs.",
    foodSources: ["grapefruit", "pomelo", "Seville oranges", "tangelos"],
  },
  {
    name: "Vitamin K",
    category: "Fat-Soluble Vitamin",
    mechanism: "Antagonizes warfarin anticoagulation — reduces INR",
    affectedDrugs: ["warfarin", "acenocoumarol", "phenprocoumon"],
    riskTier: "high" as const,
    description:
      "Vitamin K is a cofactor for clotting factor synthesis. High dietary intake directly antagonizes warfarin's anticoagulant effect.",
    foodSources: [
      "kale",
      "spinach",
      "broccoli",
      "Brussels sprouts",
      "collard greens",
      "Swiss chard",
      "parsley",
    ],
  },
  {
    name: "Tannins",
    category: "Polyphenol",
    mechanism: "Chelation — reduces absorption of iron, certain antibiotics, and alkaloids",
    affectedDrugs: ["tetracycline", "ciprofloxacin", "iron supplements", "digoxin", "nadolol"],
    riskTier: "moderate" as const,
    description:
      "Tannins form insoluble complexes with metal ions and certain drug molecules, reducing their gastrointestinal absorption.",
    foodSources: ["tea", "coffee", "red wine", "pomegranate", "persimmon", "dark chocolate"],
  },
  {
    name: "Quercetin",
    category: "Flavonoid",
    mechanism: "P-glycoprotein and CYP3A4 inhibition — alters drug bioavailability",
    affectedDrugs: ["digoxin", "cyclosporine", "paclitaxel", "vinblastine", "imatinib"],
    riskTier: "moderate" as const,
    description:
      "Quercetin inhibits P-glycoprotein efflux transporter and CYP3A4, potentially increasing plasma levels of substrate drugs.",
    foodSources: ["onions", "apples", "berries", "capers", "broccoli", "green tea"],
  },
  {
    name: "Calcium",
    category: "Mineral",
    mechanism: "Chelation — reduces absorption of fluoroquinolones and tetracyclines",
    affectedDrugs: ["ciprofloxacin", "levofloxacin", "tetracycline", "doxycycline", "bisphosphonates"],
    riskTier: "moderate" as const,
    description:
      "Calcium ions form insoluble chelates with fluoroquinolone and tetracycline antibiotics, significantly reducing their oral bioavailability.",
    foodSources: ["milk", "yogurt", "cheese", "fortified foods", "sardines", "tofu"],
  },
  {
    name: "Potassium",
    category: "Electrolyte",
    mechanism: "Additive hyperkalemia risk with potassium-sparing agents",
    affectedDrugs: ["spironolactone", "eplerenone", "ACE inhibitors", "ARBs", "trimethoprim"],
    riskTier: "moderate" as const,
    description:
      "High potassium intake combined with potassium-sparing medications can cause dangerous hyperkalemia.",
    foodSources: ["bananas", "potatoes", "avocados", "spinach", "beans", "dried fruits"],
  },
  {
    name: "Tyramine (Fermented)",
    category: "Biogenic Amine",
    mechanism: "Same as tyramine — fermentation dramatically increases tyramine content",
    affectedDrugs: ["phenelzine", "tranylcypromine", "selegiline", "linezolid"],
    riskTier: "critical" as const,
    description:
      "Fermented and aged foods contain particularly high tyramine concentrations due to bacterial decarboxylation of tyrosine.",
    foodSources: ["aged cheddar", "blue cheese", "Chianti wine", "salami", "pepperoni", "kimchi"],
  },
  {
    name: "Caffeine",
    category: "Methylxanthine",
    mechanism: "CYP1A2 substrate competition — alters caffeine and drug metabolism",
    affectedDrugs: ["clozapine", "theophylline", "fluvoxamine", "ciprofloxacin", "lithium"],
    riskTier: "low" as const,
    description:
      "Caffeine is metabolized by CYP1A2. Drugs that inhibit this enzyme can dramatically increase caffeine levels and vice versa.",
    foodSources: ["coffee", "tea", "energy drinks", "cola", "dark chocolate"],
  },
  {
    name: "Sodium",
    category: "Electrolyte",
    mechanism: "Affects lithium renal clearance — low sodium increases lithium toxicity risk",
    affectedDrugs: ["lithium"],
    riskTier: "high" as const,
    description:
      "Lithium and sodium compete for renal reabsorption. Low-sodium diets or sodium depletion can cause lithium toxicity.",
    foodSources: ["processed foods", "canned soups", "fast food", "pickles", "soy sauce"],
  },
  {
    name: "Fiber (Dietary)",
    category: "Carbohydrate",
    mechanism: "Adsorption — reduces absorption of certain drugs in GI tract",
    affectedDrugs: ["digoxin", "metformin", "levothyroxine", "carbamazepine"],
    riskTier: "low" as const,
    description:
      "High dietary fiber can adsorb certain drugs in the gastrointestinal tract, reducing their bioavailability.",
    foodSources: ["oat bran", "psyllium", "flaxseed", "legumes", "whole grains"],
  },
  {
    name: "Alcohol (Ethanol)",
    category: "CNS Depressant",
    mechanism: "CNS depression synergy, CYP2E1 induction, hepatotoxicity potentiation",
    affectedDrugs: [
      "metronidazole",
      "tinidazole",
      "benzodiazepines",
      "opioids",
      "acetaminophen",
      "warfarin",
      "metformin",
    ],
    riskTier: "high" as const,
    description:
      "Alcohol has multiple interaction mechanisms including CNS synergy, enzyme induction/inhibition, and hepatotoxicity potentiation.",
    foodSources: ["beer", "wine", "spirits", "fermented beverages", "cooking wine"],
  },
] as const;

// ============================================================
// Risk Tier Thresholds
// ============================================================

export const RISK_TIER_THRESHOLDS = {
  critical: { min: 80, max: 100, color: "#ef4444", label: "Critical" },
  high: { min: 60, max: 79, color: "#f59e0b", label: "High" },
  moderate: { min: 40, max: 59, color: "#3D56F0", label: "Moderate" },
  low: { min: 20, max: 39, color: "#22c55e", label: "Low" },
  minimal: { min: 0, max: 19, color: "#666666", label: "Minimal" },
} as const;

// ============================================================
// Demographic Constants
// ============================================================

export const AGE_GROUPS = [
  { label: "0–17", min: 0, max: 17 },
  { label: "18–44", min: 18, max: 44 },
  { label: "45–64", min: 45, max: 64 },
  { label: "65–74", min: 65, max: 74 },
  { label: "75+", min: 75, max: 120 },
] as const;

export const SEX_LABELS: Record<string, string> = {
  "1": "Male",
  "2": "Female",
  "0": "Unknown",
};

export const REACTION_OUTCOME_LABELS: Record<string, string> = {
  "1": "Recovered/Resolved",
  "2": "Recovering/Resolving",
  "3": "Not Recovered/Not Resolved",
  "4": "Recovered with Sequelae",
  "5": "Fatal",
  "6": "Unknown",
};

// ============================================================
// FDA FAERS Query Constants
// ============================================================

export const FAERS_MAX_LIMIT = 100;
export const FAERS_DEFAULT_LIMIT = 25;

export const SERIOUS_OUTCOMES = {
  DEATH: "seriousnessdeath",
  HOSPITALIZATION: "seriousnesshospitalization",
  LIFE_THREATENING: "seriousnesslifethreatening",
  DISABLING: "seriousnessdisabling",
} as const;

// ============================================================
// Food Categories with Interaction Risk
// ============================================================

export const HIGH_RISK_FOOD_CATEGORIES = [
  "Aged Cheeses",
  "Cured & Processed Meats",
  "Fermented Foods",
  "Citrus Fruits (Grapefruit family)",
  "Cruciferous Vegetables",
  "Alcoholic Beverages",
  "Caffeinated Beverages",
  "Dairy Products",
] as const;

// ============================================================
// Navigation Items
// ============================================================

export const NAV_ITEMS = [
  { label: "Dashboard", href: "/", icon: "LayoutDashboard" },
  { label: "Explore Drugs", href: "/explore", icon: "Search" },
  { label: "Food Interactions", href: "/food-interactions", icon: "Leaf" },
  { label: "Compare Drugs", href: "/compare", icon: "GitCompare" },
] as const;

// ============================================================
// Chart Colors
// ============================================================

export const CHART_COLORS = {
  primary: "#00C9A7",
  secondary: "#3D56F0",
  tertiary: "#f59e0b",
  quaternary: "#ef4444",
  quinary: "#22c55e",
  series: [
    "#00C9A7",
    "#3D56F0",
    "#f59e0b",
    "#ef4444",
    "#22c55e",
    "#a855f7",
    "#ec4899",
    "#06b6d4",
  ],
} as const;
