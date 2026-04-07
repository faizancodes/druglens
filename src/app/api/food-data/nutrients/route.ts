import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const QuerySchema = z.object({
  fdcId: z.coerce.number().int().positive(),
});

const FALLBACK_NUTRIENT_PROFILE = {
  fdcId: 2003586,
  description: "Grapefruit, raw",
  dataType: "SR Legacy",
  publicationDate: "2019-04-01",
  foodCategory: { description: "Fruits and Fruit Juices" },
  ingredients: "",
  foodNutrients: [
    { id: 1, amount: 0.77, nutrient: { id: 1003, number: "203", name: "Protein", rank: 600, unitName: "G" } },
    { id: 2, amount: 0.14, nutrient: { id: 1004, number: "204", name: "Total lipid (fat)", rank: 800, unitName: "G" } },
    { id: 3, amount: 10.66, nutrient: { id: 1005, number: "205", name: "Carbohydrate, by difference", rank: 1110, unitName: "G" } },
    { id: 4, amount: 42, nutrient: { id: 1008, number: "208", name: "Energy", rank: 300, unitName: "KCAL" } },
    { id: 5, amount: 88.06, nutrient: { id: 1051, number: "255", name: "Water", rank: 100, unitName: "G" } },
    { id: 6, amount: 22, nutrient: { id: 1087, number: "301", name: "Calcium, Ca", rank: 5300, unitName: "MG" } },
    { id: 7, amount: 0.06, nutrient: { id: 1089, number: "303", name: "Iron, Fe", rank: 5400, unitName: "MG" } },
    { id: 8, amount: 9, nutrient: { id: 1090, number: "304", name: "Magnesium, Mg", rank: 5500, unitName: "MG" } },
    { id: 9, amount: 18, nutrient: { id: 1091, number: "305", name: "Phosphorus, P", rank: 5600, unitName: "MG" } },
    { id: 10, amount: 135, nutrient: { id: 1092, number: "306", name: "Potassium, K", rank: 5700, unitName: "MG" } },
    { id: 11, amount: 0, nutrient: { id: 1093, number: "307", name: "Sodium, Na", rank: 5800, unitName: "MG" } },
    { id: 12, amount: 31.2, nutrient: { id: 1162, number: "401", name: "Vitamin C, total ascorbic acid", rank: 6300, unitName: "MG" } },
    { id: 13, amount: 0.043, nutrient: { id: 1165, number: "404", name: "Thiamin", rank: 6400, unitName: "MG" } },
    { id: 14, amount: 0.031, nutrient: { id: 1166, number: "405", name: "Riboflavin", rank: 6500, unitName: "MG" } },
    { id: 15, amount: 0.204, nutrient: { id: 1167, number: "406", name: "Niacin", rank: 6600, unitName: "MG" } },
    { id: 16, amount: 0.042, nutrient: { id: 1175, number: "415", name: "Vitamin B-6", rank: 6800, unitName: "MG" } },
    { id: 17, amount: 0, nutrient: { id: 1185, number: "430", name: "Vitamin K (phylloquinone)", rank: 6900, unitName: "UG" } },
    { id: 18, amount: 1.77, nutrient: { id: 1079, number: "291", name: "Fiber, total dietary", rank: 1200, unitName: "G" } },
    { id: 19, amount: 6.89, nutrient: { id: 2000, number: "269", name: "Sugars, total including NLEA", rank: 1510, unitName: "G" } },
  ],
  interactionFlags: [
    {
      compound: "Furanocoumarins",
      present: true,
      riskTier: "high",
      notes: "Grapefruit contains significant furanocoumarin concentrations that inhibit CYP3A4",
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

    const { fdcId } = parsed.data;
    const usdaApiKey = "DEMO_KEY";
    const usdaUrl = `https://api.nal.usda.gov/fdc/v1/food/${fdcId}?api_key=${usdaApiKey}`;

    const usdaRes = await fetch(usdaUrl, {
      headers: { "Accept": "application/json" },
      next: { revalidate: 86400 },
    });

    if (!usdaRes.ok) {
      return NextResponse.json(
        { ...FALLBACK_NUTRIENT_PROFILE, fdcId, _fallback: true },
        { headers: { "Cache-Control": "public, s-maxage=60" } }
      );
    }

    const usdaData = await usdaRes.json();

    return NextResponse.json(
      {
        fdcId: usdaData.fdcId ?? fdcId,
        description: usdaData.description ?? "",
        dataType: usdaData.dataType ?? "",
        publicationDate: usdaData.publicationDate ?? "",
        foodCategory: usdaData.foodCategory ?? { description: "" },
        ingredients: usdaData.ingredients ?? "",
        foodNutrients: Array.isArray(usdaData.foodNutrients) ? usdaData.foodNutrients : [],
      },
      { headers: { "Cache-Control": "public, s-maxage=86400" } }
    );
  } catch (err) {
    console.error("[food-data/nutrients] Error:", err);
    return NextResponse.json(
      { ...FALLBACK_NUTRIENT_PROFILE, _fallback: true },
      { headers: { "Cache-Control": "public, s-maxage=60" } }
    );
  }
}
