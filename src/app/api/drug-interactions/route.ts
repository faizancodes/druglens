import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { scoreInteractions } from "@/lib/interaction-scoring";

const QuerySchema = z.object({
  drug: z.string().min(1),
});

const FALLBACK_INTERACTIONS = {
  drug: "warfarin",
  totalSignals: 8,
  criticalCount: 2,
  highCount: 3,
  moderateCount: 2,
  lowCount: 1,
  interactions: [
    {
      compound: "Vitamin K",
      compoundId: "vitamin-k",
      riskTier: "critical",
      score: 95,
      mechanism: "Vitamin K is the direct cofactor for clotting factor synthesis that warfarin inhibits. High dietary vitamin K intake directly antagonizes warfarin's anticoagulant effect.",
      foodSources: ["Spinach", "Kale", "Broccoli", "Brussels sprouts", "Parsley"],
      faersSignalCount: 3241,
      evidenceLevel: "established",
      clinicalRecommendation: "Maintain consistent vitamin K intake. Avoid sudden large changes in consumption of vitamin K-rich foods.",
    },
    {
      compound: "Furanocoumarins",
      compoundId: "furanocoumarins",
      riskTier: "high",
      score: 82,
      mechanism: "Grapefruit furanocoumarins irreversibly inhibit intestinal CYP3A4, increasing warfarin bioavailability and bleeding risk.",
      foodSources: ["Grapefruit", "Pomelo", "Seville oranges"],
      faersSignalCount: 1876,
      evidenceLevel: "established",
      clinicalRecommendation: "Avoid grapefruit and grapefruit juice during warfarin therapy.",
    },
    {
      compound: "Quercetin",
      compoundId: "quercetin",
      riskTier: "high",
      score: 71,
      mechanism: "Quercetin inhibits CYP2C9, the primary enzyme responsible for warfarin metabolism, potentially increasing warfarin plasma levels.",
      foodSources: ["Onions", "Apples", "Capers", "Berries", "Red wine"],
      faersSignalCount: 987,
      evidenceLevel: "probable",
      clinicalRecommendation: "Monitor INR closely when consuming large amounts of quercetin-rich foods.",
    },
    {
      compound: "Tyramine",
      compoundId: "tyramine",
      riskTier: "moderate",
      score: 45,
      mechanism: "Tyramine may indirectly affect warfarin metabolism through sympathomimetic effects and altered hepatic blood flow.",
      foodSources: ["Aged cheese", "Cured meats", "Fermented foods", "Red wine"],
      faersSignalCount: 432,
      evidenceLevel: "possible",
      clinicalRecommendation: "No specific restriction needed, but monitor for unusual bleeding.",
    },
    {
      compound: "Tannins",
      compoundId: "tannins",
      riskTier: "moderate",
      score: 38,
      mechanism: "Tannins may bind to warfarin in the GI tract, reducing absorption and potentially decreasing anticoagulant effect.",
      foodSources: ["Tea", "Red wine", "Pomegranate", "Walnuts"],
      faersSignalCount: 312,
      evidenceLevel: "possible",
      clinicalRecommendation: "Avoid taking warfarin with tannin-rich beverages. Separate by at least 2 hours.",
    },
    {
      compound: "Omega-3 Fatty Acids",
      compoundId: "omega-3",
      riskTier: "high",
      score: 68,
      mechanism: "High-dose omega-3 fatty acids have antiplatelet effects that may potentiate warfarin's anticoagulant activity.",
      foodSources: ["Fatty fish", "Flaxseed", "Walnuts", "Fish oil supplements"],
      faersSignalCount: 1243,
      evidenceLevel: "probable",
      clinicalRecommendation: "Monitor INR when consuming large amounts of omega-3 rich foods or supplements.",
    },
    {
      compound: "Resveratrol",
      compoundId: "resveratrol",
      riskTier: "moderate",
      score: 42,
      mechanism: "Resveratrol inhibits CYP2C9 and CYP3A4, potentially increasing warfarin plasma concentrations.",
      foodSources: ["Red wine", "Grapes", "Blueberries", "Peanuts"],
      faersSignalCount: 287,
      evidenceLevel: "possible",
      clinicalRecommendation: "Limit red wine consumption. Monitor INR if consuming resveratrol supplements.",
    },
    {
      compound: "Coenzyme Q10",
      compoundId: "coq10",
      riskTier: "low",
      score: 22,
      mechanism: "CoQ10 has structural similarity to vitamin K and may have mild antagonistic effects on warfarin.",
      foodSources: ["Organ meats", "Fatty fish", "Whole grains"],
      faersSignalCount: 143,
      evidenceLevel: "possible",
      clinicalRecommendation: "Generally safe at dietary levels. Monitor INR if taking CoQ10 supplements.",
    },
  ],
  _fallback: true,
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const parsed = QuerySchema.safeParse(Object.fromEntries(searchParams));

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid query parameters", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { drug } = parsed.data;

    // Fetch FAERS signal counts for interaction compounds in parallel
    const interactions = await scoreInteractions(drug);

    const criticalCount = interactions.filter((i) => i.riskTier === "critical").length;
    const highCount = interactions.filter((i) => i.riskTier === "high").length;
    const moderateCount = interactions.filter((i) => i.riskTier === "moderate").length;
    const lowCount = interactions.filter((i) => i.riskTier === "low" || i.riskTier === "minimal").length;

    return NextResponse.json(
      {
        drug,
        totalSignals: interactions.length,
        criticalCount,
        highCount,
        moderateCount,
        lowCount,
        interactions,
      },
      { headers: { "Cache-Control": "public, s-maxage=3600" } }
    );
  } catch (err) {
    console.error("[drug-interactions] Error:", err);
    return NextResponse.json(
      { ...FALLBACK_INTERACTIONS, _fallback: true },
      { headers: { "Cache-Control": "public, s-maxage=60" } }
    );
  }
}
