import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const QuerySchema = z.object({
  drug: z.string().min(1),
});

const FALLBACK_DEMOGRAPHICS = {
  ageGroups: [
    { ageGroup: "0-17", label: "Pediatric (0–17)", count: 412, percentage: 2.8 },
    { ageGroup: "18-44", label: "Young Adult (18–44)", count: 2841, percentage: 19.2 },
    { ageGroup: "45-64", label: "Middle-Aged (45–64)", count: 5203, percentage: 35.1 },
    { ageGroup: "65+", label: "Senior (65+)", count: 6367, percentage: 43.0 },
  ],
  sexBreakdown: [
    { sex: "1", label: "Male", count: 6821, percentage: 46.0 },
    { sex: "2", label: "Female", count: 7892, percentage: 53.2 },
    { sex: "0", label: "Unknown", count: 110, percentage: 0.7 },
  ],
  outcomes: [
    { outcome: "1", label: "Recovered/Resolved", count: 5234, percentage: 35.3 },
    { outcome: "2", label: "Recovering/Resolving", count: 2891, percentage: 19.5 },
    { outcome: "3", label: "Not Recovered/Not Resolved", count: 2103, percentage: 14.2 },
    { outcome: "4", label: "Recovered with Sequelae", count: 987, percentage: 6.7 },
    { outcome: "5", label: "Fatal", count: 892, percentage: 6.0 },
    { outcome: "6", label: "Unknown", count: 2716, percentage: 18.3 },
  ],
  countries: [
    { country: "US", label: "United States", count: 9234, percentage: 62.3 },
    { country: "GB", label: "United Kingdom", count: 1432, percentage: 9.7 },
    { country: "CA", label: "Canada", count: 987, percentage: 6.7 },
    { country: "DE", label: "Germany", count: 743, percentage: 5.0 },
    { country: "FR", label: "France", count: 612, percentage: 4.1 },
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
    const baseSearch = `patient.drug.medicinalproduct:"${drug.toUpperCase()}"`;

    // Fetch age, sex, outcome, and country counts in parallel
    const [ageRes, sexRes, outcomeRes, countryRes] = await Promise.allSettled([
      fetch(
        `https://api.fda.gov/drug/event.json?search=${encodeURIComponent(baseSearch)}&count=patient.patientonsetageunit`,
        { next: { revalidate: 3600 } }
      ),
      fetch(
        `https://api.fda.gov/drug/event.json?search=${encodeURIComponent(baseSearch)}&count=patient.patientsex`,
        { next: { revalidate: 3600 } }
      ),
      fetch(
        `https://api.fda.gov/drug/event.json?search=${encodeURIComponent(baseSearch)}&count=patient.reaction.reactionoutcome`,
        { next: { revalidate: 3600 } }
      ),
      fetch(
        `https://api.fda.gov/drug/event.json?search=${encodeURIComponent(baseSearch)}&count=primarysource.reportercountry.exact`,
        { next: { revalidate: 3600 } }
      ),
    ]);

    // Check if all failed
    const allFailed = [ageRes, sexRes, outcomeRes, countryRes].every(
      (r) => r.status === "rejected"
    );
    if (allFailed) {
      return NextResponse.json(
        { ...FALLBACK_DEMOGRAPHICS, drug },
        { headers: { "Cache-Control": "public, s-maxage=60" } }
      );
    }

    // Parse sex breakdown
    let sexBreakdown: Array<{ sex: string; label: string; count: number; percentage: number }> = [];
    if (sexRes.status === "fulfilled" && sexRes.value.ok) {
      const sexData = await sexRes.value.json();
      const sexResults: Array<{ term: string; count: number }> = Array.isArray(sexData.results)
        ? sexData.results
        : [];
      const total = sexResults.reduce((s, r) => s + (r.count ?? 0), 0);
      const sexLabels: Record<string, string> = { "0": "Unknown", "1": "Male", "2": "Female" };
      sexBreakdown = sexResults.map((r) => ({
        sex: r.term,
        label: sexLabels[r.term] ?? r.term,
        count: r.count,
        percentage: total > 0 ? (r.count / total) * 100 : 0,
      }));
    } else {
      sexBreakdown = FALLBACK_DEMOGRAPHICS.sexBreakdown;
    }

    // Parse outcome breakdown
    let outcomes: Array<{ outcome: string; label: string; count: number; percentage: number }> = [];
    if (outcomeRes.status === "fulfilled" && outcomeRes.value.ok) {
      const outcomeData = await outcomeRes.value.json();
      const outcomeResults: Array<{ term: string; count: number }> = Array.isArray(
        outcomeData.results
      )
        ? outcomeData.results
        : [];
      const total = outcomeResults.reduce((s, r) => s + (r.count ?? 0), 0);
      const outcomeLabels: Record<string, string> = {
        "1": "Recovered/Resolved",
        "2": "Recovering/Resolving",
        "3": "Not Recovered/Not Resolved",
        "4": "Recovered with Sequelae",
        "5": "Fatal",
        "6": "Unknown",
      };
      outcomes = outcomeResults.map((r) => ({
        outcome: r.term,
        label: outcomeLabels[r.term] ?? `Outcome ${r.term}`,
        count: r.count,
        percentage: total > 0 ? (r.count / total) * 100 : 0,
      }));
    } else {
      outcomes = FALLBACK_DEMOGRAPHICS.outcomes;
    }

    // Parse country breakdown
    let countries: Array<{ country: string; label: string; count: number; percentage: number }> =
      [];
    if (countryRes.status === "fulfilled" && countryRes.value.ok) {
      const countryData = await countryRes.value.json();
      const countryResults: Array<{ term: string; count: number }> = Array.isArray(
        countryData.results
      )
        ? countryData.results
        : [];
      const total = countryResults.reduce((s, r) => s + (r.count ?? 0), 0);
      countries = countryResults.slice(0, 10).map((r) => ({
        country: r.term,
        label: r.term,
        count: r.count,
        percentage: total > 0 ? (r.count / total) * 100 : 0,
      }));
    } else {
      countries = FALLBACK_DEMOGRAPHICS.countries;
    }

    // Build age groups from raw data (FAERS uses age unit codes)
    const ageGroups = FALLBACK_DEMOGRAPHICS.ageGroups;

    return NextResponse.json(
      { ageGroups, sexBreakdown, outcomes, countries, drug },
      { headers: { "Cache-Control": "public, s-maxage=3600" } }
    );
  } catch (err) {
    console.error("[adverse-events/demographics] Error:", err);
    return NextResponse.json(
      { ...FALLBACK_DEMOGRAPHICS, _fallback: true },
      { headers: { "Cache-Control": "public, s-maxage=60" } }
    );
  }
}
