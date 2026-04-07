import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const QuerySchema = z.object({
  q: z.string().min(1).default("warfarin"),
  riskTier: z.enum(["all", "critical", "high", "moderate", "low", "minimal"]).default("all"),
  seriousness: z.enum(["all", "serious", "non-serious"]).default("all"),
  sortBy: z.enum(["reports", "risk", "name", "date"]).default("reports"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

// Fallback drug results for when FDA API is unavailable
const FALLBACK_DRUGS = [
  {
    name: "warfarin",
    genericName: "warfarin sodium",
    totalReports: 148230,
    riskScore: 92,
    riskTier: "critical",
    topReaction: "Haemorrhage",
    interactionCount: 8,
    seriousPercent: 68.4,
    fatalityPercent: 12.1,
    foodInteractionFlag: true,
  },
  {
    name: "simvastatin",
    genericName: "simvastatin",
    totalReports: 87450,
    riskScore: 71,
    riskTier: "high",
    topReaction: "Myopathy",
    interactionCount: 5,
    seriousPercent: 42.3,
    fatalityPercent: 3.2,
    foodInteractionFlag: true,
  },
  {
    name: "metformin",
    genericName: "metformin hydrochloride",
    totalReports: 62100,
    riskScore: 45,
    riskTier: "moderate",
    topReaction: "Nausea",
    interactionCount: 3,
    seriousPercent: 28.7,
    fatalityPercent: 1.4,
    foodInteractionFlag: false,
  },
  {
    name: "lisinopril",
    genericName: "lisinopril",
    totalReports: 54320,
    riskScore: 52,
    riskTier: "moderate",
    topReaction: "Cough",
    interactionCount: 4,
    seriousPercent: 31.2,
    fatalityPercent: 2.1,
    foodInteractionFlag: true,
  },
  {
    name: "atorvastatin",
    genericName: "atorvastatin calcium",
    totalReports: 49870,
    riskScore: 48,
    riskTier: "moderate",
    topReaction: "Myalgia",
    interactionCount: 4,
    seriousPercent: 25.6,
    fatalityPercent: 1.8,
    foodInteractionFlag: true,
  },
  {
    name: "phenelzine",
    genericName: "phenelzine sulfate",
    totalReports: 12340,
    riskScore: 88,
    riskTier: "critical",
    topReaction: "Hypertensive crisis",
    interactionCount: 9,
    seriousPercent: 74.1,
    fatalityPercent: 8.9,
    foodInteractionFlag: true,
  },
  {
    name: "amiodarone",
    genericName: "amiodarone hydrochloride",
    totalReports: 38920,
    riskScore: 79,
    riskTier: "high",
    topReaction: "Pulmonary toxicity",
    interactionCount: 6,
    seriousPercent: 58.3,
    fatalityPercent: 7.4,
    foodInteractionFlag: true,
  },
  {
    name: "digoxin",
    genericName: "digoxin",
    totalReports: 29450,
    riskScore: 76,
    riskTier: "high",
    topReaction: "Cardiac arrhythmia",
    interactionCount: 5,
    seriousPercent: 61.7,
    fatalityPercent: 9.2,
    foodInteractionFlag: true,
  },
  {
    name: "cyclosporine",
    genericName: "cyclosporine",
    totalReports: 22180,
    riskScore: 83,
    riskTier: "critical",
    topReaction: "Nephrotoxicity",
    interactionCount: 7,
    seriousPercent: 65.4,
    fatalityPercent: 5.6,
    foodInteractionFlag: true,
  },
  {
    name: "fluoxetine",
    genericName: "fluoxetine hydrochloride",
    totalReports: 71230,
    riskScore: 55,
    riskTier: "moderate",
    topReaction: "Nausea",
    interactionCount: 4,
    seriousPercent: 33.8,
    fatalityPercent: 2.3,
    foodInteractionFlag: false,
  },
  {
    name: "ibuprofen",
    genericName: "ibuprofen",
    totalReports: 93450,
    riskScore: 58,
    riskTier: "moderate",
    topReaction: "Gastrointestinal haemorrhage",
    interactionCount: 3,
    seriousPercent: 38.2,
    fatalityPercent: 3.7,
    foodInteractionFlag: false,
  },
  {
    name: "omeprazole",
    genericName: "omeprazole",
    totalReports: 41200,
    riskScore: 32,
    riskTier: "low",
    topReaction: "Headache",
    interactionCount: 2,
    seriousPercent: 18.4,
    fatalityPercent: 0.9,
    foodInteractionFlag: false,
  },
];

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

    const { q, riskTier, seriousness, sortBy, sortOrder, page, pageSize } = parsed.data;

    // Try to fetch from FDA FAERS count endpoint
    try {
      const searchQuery = `patient.drug.medicinalproduct:"${q.toUpperCase()}"`;
      const fdaUrl = `https://api.fda.gov/drug/event.json?search=${encodeURIComponent(searchQuery)}&count=patient.reaction.reactionmeddrapt.exact&limit=5`;

      const fdaRes = await fetch(fdaUrl, {
        headers: { Accept: "application/json" },
        next: { revalidate: 300 },
      });

      if (fdaRes.ok) {
        const fdaData = await fdaRes.json();
        const topReactions = Array.isArray(fdaData.results) ? fdaData.results : [];
        const topReaction = topReactions[0]?.term ?? "Unknown";

        // Also get total count
        const countUrl = `https://api.fda.gov/drug/event.json?search=${encodeURIComponent(searchQuery)}&limit=1`;
        const countRes = await fetch(countUrl, {
          headers: { Accept: "application/json" },
          next: { revalidate: 300 },
        });

        let totalReports = 0;
        if (countRes.ok) {
          const countData = await countRes.json();
          totalReports = countData.meta?.results?.total ?? 0;
        }

        const riskScore = Math.min(100, Math.round((totalReports / 1000) * 0.5 + 30));
        const computedRiskTier =
          riskScore >= 80 ? "critical" :
          riskScore >= 65 ? "high" :
          riskScore >= 45 ? "moderate" :
          riskScore >= 25 ? "low" : "minimal";

        const result = {
          name: q.toLowerCase(),
          genericName: q.toLowerCase(),
          totalReports,
          riskScore,
          riskTier: computedRiskTier,
          topReaction,
          interactionCount: 0,
          seriousPercent: 0,
          fatalityPercent: 0,
          foodInteractionFlag: false,
        };

        return NextResponse.json(
          {
            items: [result],
            total: 1,
            page,
            pageSize,
            totalPages: 1,
          },
          { headers: { "Cache-Control": "public, s-maxage=300" } }
        );
      }
    } catch {
      // Fall through to fallback
    }

    // Filter fallback data
    let filtered = FALLBACK_DRUGS.filter((d) => {
      const matchesQuery =
        !q ||
        d.name.includes(q.toLowerCase()) ||
        d.genericName.includes(q.toLowerCase());
      const matchesRisk = riskTier === "all" || d.riskTier === riskTier;
      const matchesSeriousness =
        seriousness === "all" ||
        (seriousness === "serious" && d.seriousPercent >= 50) ||
        (seriousness === "non-serious" && d.seriousPercent < 50);
      return matchesQuery && matchesRisk && matchesSeriousness;
    });

    // Sort
    filtered.sort((a, b) => {
      let cmp = 0;
      if (sortBy === "reports") cmp = a.totalReports - b.totalReports;
      else if (sortBy === "risk") cmp = a.riskScore - b.riskScore;
      else if (sortBy === "name") cmp = a.name.localeCompare(b.name);
      if (sortOrder === "desc") cmp = -cmp;
      return cmp;
    });

    const total = filtered.length;
    const start = (page - 1) * pageSize;
    const items = filtered.slice(start, start + pageSize);

    return NextResponse.json(
      {
        items,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
        _fallback: true,
      },
      { headers: { "Cache-Control": "public, s-maxage=60" } }
    );
  } catch (err) {
    console.error("[explore] Error:", err);
    return NextResponse.json(
      {
        items: FALLBACK_DRUGS.slice(0, 10),
        total: FALLBACK_DRUGS.length,
        page: 1,
        pageSize: 20,
        totalPages: 1,
        _fallback: true,
      },
      { status: 500 }
    );
  }
}
