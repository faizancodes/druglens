import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const QuerySchema = z.object({
  drug: z.string().min(1),
  limit: z.coerce.number().int().min(1).max(100).default(25),
  skip: z.coerce.number().int().min(0).default(0),
  serious: z.enum(["true", "false"]).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  sex: z.string().optional(),
  ageGroup: z.string().optional(),
});

// Seed fallback data for when FDA API is unavailable
const FALLBACK_DATA = {
  totalReports: 14823,
  seriousReports: 6241,
  deathReports: 892,
  hospitalizationReports: 3104,
  topReactions: [
    { reaction: "Nausea", count: 2341, percentage: 15.8 },
    { reaction: "Headache", count: 1987, percentage: 13.4 },
    { reaction: "Dizziness", count: 1654, percentage: 11.2 },
    { reaction: "Fatigue", count: 1432, percentage: 9.7 },
    { reaction: "Vomiting", count: 1198, percentage: 8.1 },
    { reaction: "Diarrhoea", count: 987, percentage: 6.7 },
    { reaction: "Dyspnoea", count: 876, percentage: 5.9 },
    { reaction: "Rash", count: 743, percentage: 5.0 },
    { reaction: "Pain", count: 698, percentage: 4.7 },
    { reaction: "Insomnia", count: 612, percentage: 4.1 },
  ],
  recentEvents: [
    {
      safetyreportid: "FALLBACK-001",
      receivedate: "20240115",
      serious: "1",
      seriousnessdeath: "0",
      seriousnesshospitalization: "1",
      seriousnesslifethreatening: "0",
      seriousnessdisabling: "0",
      patient: {
        patientonsetage: "65",
        patientonsetageunit: "801",
        patientsex: "1",
        patientweight: "78",
        reaction: [{ reactionmeddrapt: "Nausea", reactionoutcome: "1" }],
        drug: [{ medicinalproduct: "WARFARIN", drugindication: "Anticoagulation", drugadministrationroute: "048", drugdosagetext: "5mg daily", drugcharacterization: "1", activesubstance: { activesubstancename: "WARFARIN" } }],
      },
      primarysource: { reportercountry: "US", qualification: "1" },
      reportduplicate: "0",
    },
    {
      safetyreportid: "FALLBACK-002",
      receivedate: "20240210",
      serious: "1",
      seriousnessdeath: "0",
      seriousnesshospitalization: "0",
      seriousnesslifethreatening: "1",
      seriousnessdisabling: "0",
      patient: {
        patientonsetage: "52",
        patientonsetageunit: "801",
        patientsex: "2",
        patientweight: "62",
        reaction: [{ reactionmeddrapt: "Haemorrhage", reactionoutcome: "2" }],
        drug: [{ medicinalproduct: "WARFARIN", drugindication: "Atrial fibrillation", drugadministrationroute: "048", drugdosagetext: "7.5mg daily", drugcharacterization: "1", activesubstance: { activesubstancename: "WARFARIN" } }],
      },
      primarysource: { reportercountry: "US", qualification: "3" },
      reportduplicate: "0",
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

    const { drug, limit, skip, serious, startDate, endDate, sex, ageGroup } = parsed.data;

    // Build FDA FAERS search query
    const searchTerms: string[] = [
      `patient.drug.medicinalproduct:"${drug.toUpperCase()}"`,
    ];

    if (serious === "true") {
      searchTerms.push("serious:1");
    }

    if (startDate && endDate) {
      searchTerms.push(`receivedate:[${startDate} TO ${endDate}]`);
    }

    if (sex) {
      searchTerms.push(`patient.patientsex:${sex}`);
    }

    if (ageGroup) {
      const ageRanges: Record<string, string> = {
        "0-17": "[0 TO 17]",
        "18-44": "[18 TO 44]",
        "45-64": "[45 TO 64]",
        "65+": "[65 TO 120]",
      };
      const range = ageRanges[ageGroup];
      if (range) {
        searchTerms.push(`patient.patientonsetage:${range}`);
      }
    }

    const searchQuery = searchTerms.join("+AND+");
    const fdaUrl = `https://api.fda.gov/drug/event.json?search=${encodeURIComponent(searchQuery)}&limit=${limit}&skip=${skip}`;

    const fdaRes = await fetch(fdaUrl, {
      headers: { "Accept": "application/json" },
      next: { revalidate: 300 },
    });

    if (!fdaRes.ok) {
      // Return fallback data when FDA API fails
      return NextResponse.json(
        { ...FALLBACK_DATA, drug, _fallback: true },
        { headers: { "Cache-Control": "public, s-maxage=60" } }
      );
    }

    const fdaData = await fdaRes.json();
    const results = Array.isArray(fdaData.results) ? fdaData.results : [];
    const total = fdaData.meta?.results?.total ?? 0;

    // Aggregate reaction counts
    const reactionMap = new Map<string, number>();
    for (const event of results) {
      const reactions = Array.isArray(event.patient?.reaction) ? event.patient.reaction : [];
      for (const r of reactions) {
        if (r.reactionmeddrapt) {
          reactionMap.set(r.reactionmeddrapt, (reactionMap.get(r.reactionmeddrapt) ?? 0) + 1);
        }
      }
    }

    const topReactions = Array.from(reactionMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([reaction, count]) => ({
        reaction,
        count,
        percentage: total > 0 ? (count / total) * 100 : 0,
      }));

    const seriousCount = results.filter((e: { serious?: string }) => e.serious === "1").length;
    const deathCount = results.filter((e: { seriousnessdeath?: string }) => e.seriousnessdeath === "1").length;
    const hospCount = results.filter((e: { seriousnesshospitalization?: string }) => e.seriousnesshospitalization === "1").length;

    return NextResponse.json(
      {
        totalReports: total,
        seriousReports: seriousCount,
        deathReports: deathCount,
        hospitalizationReports: hospCount,
        topReactions,
        recentEvents: results.slice(0, 10),
        drug,
        meta: fdaData.meta,
      },
      { headers: { "Cache-Control": "public, s-maxage=300" } }
    );
  } catch (err) {
    console.error("[adverse-events] Error:", err);
    return NextResponse.json(
      { ...FALLBACK_DATA, _fallback: true },
      { headers: { "Cache-Control": "public, s-maxage=60" } }
    );
  }
}
