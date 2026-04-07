import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const QuerySchema = z.object({
  drug: z.string().min(1),
});

const FALLBACK_LABEL = {
  drug: "warfarin",
  brandName: "COUMADIN",
  genericName: "warfarin sodium",
  manufacturer: "Bristol-Myers Squibb",
  productType: "HUMAN PRESCRIPTION DRUG",
  route: ["ORAL"],
  warnings: [
    "BLEEDING RISK: Warfarin sodium can cause major or fatal bleeding. Bleeding is more likely to occur during the starting period and with a higher dose (resulting in a higher INR). Risk factors for bleeding include high intensity of anticoagulation (INR >4.0), age ≥65, highly variable INRs, history of gastrointestinal bleeding, hypertension, cerebrovascular disease, serious heart disease, anemia, malignancy, trauma, renal insufficiency, and certain genetic factors.",
    "DRUG INTERACTIONS: The concomitant use of warfarin sodium with other drugs may result in increased anticoagulant effects with risk of serious bleeding or decreased anticoagulant effects with risk of thrombosis.",
  ],
  foodInteractions: [
    "Vitamin K-containing foods: Patients should maintain a consistent diet with respect to vitamin K-containing foods. Sudden changes in dietary intake of vitamin K may affect INR.",
    "Grapefruit juice: May increase warfarin plasma concentrations through inhibition of CYP3A4.",
    "Cranberry juice: May increase INR and bleeding risk through unknown mechanism.",
    "Alcohol: Acute alcohol ingestion may increase anticoagulant effect; chronic alcohol use may decrease anticoagulant effect.",
  ],
  drugInteractions: [
    "Antiplatelet agents, aspirin, NSAIDs: Increased bleeding risk",
    "Antibiotics: May alter gut flora affecting vitamin K synthesis",
    "Antifungals (fluconazole, miconazole): Inhibit CYP2C9, increasing warfarin effect",
    "Amiodarone: Inhibits CYP2C9 and CYP3A4, significantly increasing warfarin effect",
  ],
  indications: [
    "Prophylaxis and treatment of venous thrombosis and its extension, pulmonary embolism",
    "Prophylaxis and treatment of thromboembolic complications associated with atrial fibrillation and/or cardiac valve replacement",
    "Reduction in the risk of death, recurrent myocardial infarction, and thromboembolic events such as stroke or systemic embolization after myocardial infarction",
  ],
  contraindications: [
    "Pregnancy (except in women with mechanical heart valves)",
    "Hemorrhagic tendencies or blood dyscrasias",
    "Recent or contemplated surgery of the central nervous system or eye",
    "Unsupervised patients with conditions associated with potential high levels of non-compliance",
  ],
  dosageAdministration: "Individualize dosing regimen for each patient; adjust based on INR response. Usual maintenance dose is 2–10 mg daily.",
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

    const fdaUrl = `https://api.fda.gov/drug/label.json?search=openfda.generic_name:"${encodeURIComponent(drug)}"&limit=1`;

    const fdaRes = await fetch(fdaUrl, {
      headers: { "Accept": "application/json" },
      next: { revalidate: 86400 },
    });

    if (!fdaRes.ok) {
      return NextResponse.json(
        { ...FALLBACK_LABEL, drug, _fallback: true },
        { headers: { "Cache-Control": "public, s-maxage=60" } }
      );
    }

    const fdaData = await fdaRes.json();
    const results: Array<Record<string, unknown>> = Array.isArray(fdaData.results)
      ? fdaData.results
      : [];

    if (results.length === 0) {
      // Try brand name search
      const brandUrl = `https://api.fda.gov/drug/label.json?search=openfda.brand_name:"${encodeURIComponent(drug)}"&limit=1`;
      const brandRes = await fetch(brandUrl, {
        headers: { "Accept": "application/json" },
        next: { revalidate: 86400 },
      });

      if (!brandRes.ok) {
        return NextResponse.json(
          { ...FALLBACK_LABEL, drug, _fallback: true },
          { headers: { "Cache-Control": "public, s-maxage=60" } }
        );
      }

      const brandData = await brandRes.json();
      const brandResults: Array<Record<string, unknown>> = Array.isArray(brandData.results)
        ? brandData.results
        : [];

      if (brandResults.length === 0) {
        return NextResponse.json(
          { ...FALLBACK_LABEL, drug, _fallback: true },
          { headers: { "Cache-Control": "public, s-maxage=60" } }
        );
      }

      return NextResponse.json(
        parseLabelResult(brandResults[0], drug),
        { headers: { "Cache-Control": "public, s-maxage=86400" } }
      );
    }

    return NextResponse.json(
      parseLabelResult(results[0], drug),
      { headers: { "Cache-Control": "public, s-maxage=86400" } }
    );
  } catch (err) {
    console.error("[drug-label] Error:", err);
    return NextResponse.json(
      { ...FALLBACK_LABEL, _fallback: true },
      { headers: { "Cache-Control": "public, s-maxage=60" } }
    );
  }
}

function parseLabelResult(result: Record<string, unknown>, drug: string) {
  const openfda = (result.openfda ?? {}) as Record<string, unknown>;
  const getArr = (key: string): string[] => {
    const val = openfda[key];
    return Array.isArray(val) ? val.map(String) : [];
  };
  const getField = (key: string): string[] => {
    const val = result[key];
    return Array.isArray(val) ? val.map(String) : [];
  };

  return {
    drug,
    brandName: getArr("brand_name")[0] ?? drug.toUpperCase(),
    genericName: getArr("generic_name")[0] ?? drug,
    manufacturer: getArr("manufacturer_name")[0] ?? "Unknown",
    productType: getArr("product_type")[0] ?? "HUMAN PRESCRIPTION DRUG",
    route: getArr("route"),
    warnings: getField("warnings_and_cautions").concat(getField("warnings")),
    foodInteractions: getField("food_and_drug_interactions"),
    drugInteractions: getField("drug_interactions"),
    indications: getField("indications_and_usage"),
    contraindications: getField("contraindications"),
    dosageAdministration: getField("dosage_and_administration")[0] ?? "",
  };
}
