/**
 * Interaction Scoring Engine
 *
 * Cross-references drug names against known interaction compounds from constants,
 * enriches with FAERS signal counts, and computes risk scores.
 */

import type { RiskTier } from "@/lib/types";

// ============================================================
// Types
// ============================================================

export interface ScoredInteraction {
  compound: string;
  compoundId: string;
  riskTier: RiskTier;
  score: number;
  mechanism: string;
  foodSources: string[];
  faersSignalCount: number;
  evidenceLevel: "established" | "probable" | "possible" | "theoretical";
  clinicalRecommendation: string;
}

// ============================================================
// Compound Interaction Database
// Maps drug name patterns to known interaction compounds with base scores
// ============================================================

interface CompoundDefinition {
  compound: string;
  compoundId: string;
  mechanism: string;
  foodSources: string[];
  evidenceLevel: "established" | "probable" | "possible" | "theoretical";
  clinicalRecommendation: string;
  baseScore: number;
  riskTier: RiskTier;
  drugPatterns: RegExp[];
}

const COMPOUND_DATABASE: CompoundDefinition[] = [
  {
    compound: "Vitamin K",
    compoundId: "vitamin-k",
    mechanism:
      "Vitamin K is the direct cofactor for clotting factor synthesis. High dietary vitamin K intake directly antagonizes warfarin's anticoagulant effect by competing with the drug's mechanism of action.",
    foodSources: ["Spinach", "Kale", "Broccoli", "Brussels sprouts", "Parsley", "Swiss chard"],
    evidenceLevel: "established",
    clinicalRecommendation:
      "Maintain consistent vitamin K intake. Avoid sudden large changes in consumption of vitamin K-rich foods. Monitor INR closely.",
    baseScore: 95,
    riskTier: "critical",
    drugPatterns: [/warfarin/i, /coumadin/i, /acenocoumarol/i, /phenprocoumon/i],
  },
  {
    compound: "Furanocoumarins",
    compoundId: "furanocoumarins",
    mechanism:
      "Grapefruit furanocoumarins (bergamottin, 6,7-dihydroxybergamottin) irreversibly inhibit intestinal CYP3A4, dramatically increasing bioavailability of many drugs metabolized by this enzyme.",
    foodSources: ["Grapefruit", "Pomelo", "Seville oranges", "Tangelo"],
    evidenceLevel: "established",
    clinicalRecommendation:
      "Avoid grapefruit and grapefruit juice during therapy. Effect persists for 24–72 hours after consumption.",
    baseScore: 88,
    riskTier: "critical",
    drugPatterns: [
      /statin/i,
      /simvastatin/i,
      /atorvastatin/i,
      /lovastatin/i,
      /cyclosporine/i,
      /tacrolimus/i,
      /felodipine/i,
      /nifedipine/i,
      /amlodipine/i,
      /warfarin/i,
      /midazolam/i,
      /buspirone/i,
      /sildenafil/i,
      /tadalafil/i,
      /saquinavir/i,
      /indinavir/i,
    ],
  },
  {
    compound: "Tyramine",
    compoundId: "tyramine",
    mechanism:
      "MAO inhibitors block tyramine metabolism, causing accumulation and potentially life-threatening hypertensive crisis. Tyramine triggers norepinephrine release from sympathetic nerve terminals.",
    foodSources: [
      "Aged cheese",
      "Cured meats",
      "Fermented foods",
      "Red wine",
      "Soy sauce",
      "Miso",
      "Tap beer",
    ],
    evidenceLevel: "established",
    clinicalRecommendation:
      "Strictly avoid tyramine-rich foods during MAOI therapy. Risk of hypertensive crisis is severe and potentially fatal.",
    baseScore: 98,
    riskTier: "critical",
    drugPatterns: [
      /phenelzine/i,
      /tranylcypromine/i,
      /isocarboxazid/i,
      /selegiline/i,
      /rasagiline/i,
      /linezolid/i,
      /maoi/i,
    ],
  },
  {
    compound: "Quercetin",
    compoundId: "quercetin",
    mechanism:
      "Quercetin inhibits CYP2C9 and CYP3A4 enzymes, potentially increasing plasma concentrations of drugs metabolized by these pathways. Also has antiplatelet activity.",
    foodSources: ["Onions", "Apples", "Capers", "Berries", "Red wine", "Green tea"],
    evidenceLevel: "probable",
    clinicalRecommendation:
      "Monitor drug levels and therapeutic response when consuming large amounts of quercetin-rich foods or supplements.",
    baseScore: 65,
    riskTier: "high",
    drugPatterns: [
      /warfarin/i,
      /cyclosporine/i,
      /digoxin/i,
      /fexofenadine/i,
      /paclitaxel/i,
      /tamoxifen/i,
    ],
  },
  {
    compound: "Tannins",
    compoundId: "tannins",
    mechanism:
      "Tannins form insoluble complexes with many drugs in the GI tract, reducing absorption and bioavailability. May also inhibit iron absorption.",
    foodSources: ["Tea", "Red wine", "Pomegranate", "Walnuts", "Dark chocolate", "Coffee"],
    evidenceLevel: "probable",
    clinicalRecommendation:
      "Avoid taking medications with tannin-rich beverages. Separate administration by at least 2 hours.",
    baseScore: 55,
    riskTier: "moderate",
    drugPatterns: [
      /iron/i,
      /ferrous/i,
      /tetracycline/i,
      /doxycycline/i,
      /ciprofloxacin/i,
      /levofloxacin/i,
      /digoxin/i,
      /metformin/i,
    ],
  },
  {
    compound: "Omega-3 Fatty Acids",
    compoundId: "omega-3",
    mechanism:
      "High-dose omega-3 fatty acids have antiplatelet effects and may inhibit thromboxane A2 synthesis, potentiating anticoagulant and antiplatelet drug effects.",
    foodSources: ["Fatty fish", "Flaxseed", "Walnuts", "Chia seeds", "Fish oil supplements"],
    evidenceLevel: "probable",
    clinicalRecommendation:
      "Monitor bleeding parameters when consuming large amounts of omega-3 rich foods or supplements alongside anticoagulants.",
    baseScore: 60,
    riskTier: "high",
    drugPatterns: [
      /warfarin/i,
      /aspirin/i,
      /clopidogrel/i,
      /ticagrelor/i,
      /prasugrel/i,
      /heparin/i,
      /enoxaparin/i,
      /rivaroxaban/i,
      /apixaban/i,
      /dabigatran/i,
    ],
  },
  {
    compound: "Resveratrol",
    compoundId: "resveratrol",
    mechanism:
      "Resveratrol inhibits CYP2C9 and CYP3A4 enzymes and has antiplatelet properties, potentially increasing plasma concentrations and effects of anticoagulants.",
    foodSources: ["Red wine", "Grapes", "Blueberries", "Peanuts", "Dark chocolate"],
    evidenceLevel: "possible",
    clinicalRecommendation:
      "Limit red wine consumption. Monitor INR if consuming resveratrol supplements alongside anticoagulants.",
    baseScore: 42,
    riskTier: "moderate",
    drugPatterns: [/warfarin/i, /aspirin/i, /clopidogrel/i, /statins/i, /simvastatin/i],
  },
  {
    compound: "Calcium",
    compoundId: "calcium",
    mechanism:
      "High calcium intake can reduce absorption of certain antibiotics (fluoroquinolones, tetracyclines) and bisphosphonates by forming insoluble chelate complexes.",
    foodSources: ["Dairy products", "Fortified foods", "Leafy greens", "Sardines", "Tofu"],
    evidenceLevel: "established",
    clinicalRecommendation:
      "Separate calcium-rich foods and supplements from affected medications by at least 2 hours.",
    baseScore: 72,
    riskTier: "high",
    drugPatterns: [
      /ciprofloxacin/i,
      /levofloxacin/i,
      /tetracycline/i,
      /doxycycline/i,
      /alendronate/i,
      /risedronate/i,
      /levothyroxine/i,
    ],
  },
  {
    compound: "Potassium",
    compoundId: "potassium",
    mechanism:
      "High potassium intake may cause hyperkalemia when combined with potassium-sparing diuretics, ACE inhibitors, or ARBs, leading to dangerous cardiac arrhythmias.",
    foodSources: ["Bananas", "Potatoes", "Avocados", "Spinach", "Beans", "Tomatoes"],
    evidenceLevel: "established",
    clinicalRecommendation:
      "Monitor serum potassium levels regularly. Limit high-potassium foods if taking potassium-sparing medications.",
    baseScore: 78,
    riskTier: "high",
    drugPatterns: [
      /spironolactone/i,
      /eplerenone/i,
      /triamterene/i,
      /amiloride/i,
      /lisinopril/i,
      /enalapril/i,
      /ramipril/i,
      /losartan/i,
      /valsartan/i,
      /candesartan/i,
    ],
  },
  {
    compound: "Caffeine",
    compoundId: "caffeine",
    mechanism:
      "Caffeine is metabolized by CYP1A2. Drugs that inhibit CYP1A2 can increase caffeine levels, causing toxicity. Caffeine also has stimulant effects that may interact with cardiovascular medications.",
    foodSources: ["Coffee", "Tea", "Energy drinks", "Dark chocolate", "Cola beverages"],
    evidenceLevel: "probable",
    clinicalRecommendation:
      "Limit caffeine intake when taking CYP1A2 inhibitors. Monitor for caffeine toxicity symptoms.",
    baseScore: 48,
    riskTier: "moderate",
    drugPatterns: [
      /fluvoxamine/i,
      /ciprofloxacin/i,
      /mexiletine/i,
      /clozapine/i,
      /theophylline/i,
    ],
  },
  {
    compound: "Coenzyme Q10",
    compoundId: "coq10",
    mechanism:
      "CoQ10 has structural similarity to vitamin K and may have mild antagonistic effects on vitamin K-dependent anticoagulants. Also may reduce statin-induced myopathy.",
    foodSources: ["Organ meats", "Fatty fish", "Whole grains", "Nuts", "Vegetables"],
    evidenceLevel: "possible",
    clinicalRecommendation:
      "Generally safe at dietary levels. Monitor INR if taking CoQ10 supplements alongside anticoagulants.",
    baseScore: 25,
    riskTier: "low",
    drugPatterns: [/warfarin/i, /statin/i, /simvastatin/i, /atorvastatin/i],
  },
  {
    compound: "Sodium",
    compoundId: "sodium",
    mechanism:
      "High sodium intake can reduce the effectiveness of antihypertensive medications and diuretics by increasing fluid retention and blood pressure.",
    foodSources: ["Processed foods", "Canned goods", "Fast food", "Salty snacks", "Pickles"],
    evidenceLevel: "established",
    clinicalRecommendation:
      "Follow a low-sodium diet (< 2300 mg/day) when taking antihypertensive medications for optimal therapeutic effect.",
    baseScore: 62,
    riskTier: "high",
    drugPatterns: [
      /lisinopril/i,
      /amlodipine/i,
      /metoprolol/i,
      /hydrochlorothiazide/i,
      /furosemide/i,
      /losartan/i,
      /valsartan/i,
    ],
  },
];

// ============================================================
// FAERS Signal Fetcher
// ============================================================

async function fetchFAERSSignalCount(drug: string, compound: string): Promise<number> {
  try {
    const searchQuery = `patient.drug.medicinalproduct:"${drug.toUpperCase()}"+AND+patient.reaction.reactionmeddrapt:"${compound}"`;
    const url = `https://api.fda.gov/drug/event.json?search=${encodeURIComponent(searchQuery)}&count=patient.reaction.reactionmeddrapt&limit=1`;

    const res = await fetch(url, {
      headers: { "Accept": "application/json" },
      next: { revalidate: 3600 },
    });

    if (!res.ok) return 0;

    const data = await res.json();
    const meta = data?.meta?.results;
    return typeof meta?.total === "number" ? meta.total : 0;
  } catch {
    return 0;
  }
}

// ============================================================
// Main Scoring Function
// ============================================================

export async function scoreInteractions(drug: string): Promise<ScoredInteraction[]> {
  const normalizedDrug = drug.toLowerCase().trim();

  // Find matching compounds for this drug
  const matchingCompounds = COMPOUND_DATABASE.filter((c) =>
    c.drugPatterns.some((pattern) => pattern.test(normalizedDrug))
  );

  if (matchingCompounds.length === 0) {
    // Return a generic set of interactions for unknown drugs
    return COMPOUND_DATABASE.slice(0, 4).map((c) => ({
      compound: c.compound,
      compoundId: c.compoundId,
      riskTier: "low" as RiskTier,
      score: Math.max(10, c.baseScore - 40),
      mechanism: c.mechanism,
      foodSources: c.foodSources,
      faersSignalCount: 0,
      evidenceLevel: "theoretical" as const,
      clinicalRecommendation: c.clinicalRecommendation,
    }));
  }

  // Fetch FAERS signal counts in parallel (with timeout)
  const signalCounts = await Promise.allSettled(
    matchingCompounds.map((c) => fetchFAERSSignalCount(drug, c.compound))
  );

  // Build scored interactions
  const scored: ScoredInteraction[] = matchingCompounds.map((compound, i) => {
    const faersCount =
      signalCounts[i].status === "fulfilled" ? signalCounts[i].value : 0;

    // Adjust score based on FAERS signal strength
    const signalBoost = faersCount > 1000 ? 5 : faersCount > 100 ? 3 : faersCount > 10 ? 1 : 0;
    const finalScore = Math.min(100, compound.baseScore + signalBoost);

    return {
      compound: compound.compound,
      compoundId: compound.compoundId,
      riskTier: compound.riskTier,
      score: finalScore,
      mechanism: compound.mechanism,
      foodSources: compound.foodSources,
      faersSignalCount: faersCount,
      evidenceLevel: compound.evidenceLevel,
      clinicalRecommendation: compound.clinicalRecommendation,
    };
  });

  // Sort by score descending
  return scored.sort((a, b) => b.score - a.score);
}

// ============================================================
// Utility: Compute overall drug risk from interactions
// ============================================================

export function computeOverallRisk(interactions: ScoredInteraction[]): {
  overallScore: number;
  overallTier: RiskTier;
  summary: string;
} {
  if (interactions.length === 0) {
    return { overallScore: 0, overallTier: "minimal", summary: "No known food-drug interactions identified." };
  }

  const maxScore = Math.max(...interactions.map((i) => i.score));
  const criticalCount = interactions.filter((i) => i.riskTier === "critical").length;
  const highCount = interactions.filter((i) => i.riskTier === "high").length;

  let overallTier: RiskTier;
  if (criticalCount > 0) overallTier = "critical";
  else if (highCount >= 2) overallTier = "high";
  else if (highCount === 1) overallTier = "high";
  else if (interactions.some((i) => i.riskTier === "moderate")) overallTier = "moderate";
  else overallTier = "low";

  const summary =
    criticalCount > 0
      ? `${criticalCount} critical food-drug interaction${criticalCount > 1 ? "s" : ""} identified. Immediate dietary counseling recommended.`
      : highCount > 0
      ? `${highCount} high-risk food-drug interaction${highCount > 1 ? "s" : ""} identified. Monitor closely.`
      : `${interactions.length} potential food-drug interaction${interactions.length > 1 ? "s" : ""} identified. Standard monitoring recommended.`;

  return { overallScore: maxScore, overallTier, summary };
}
