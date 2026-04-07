import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const QuerySchema = z.object({
  q: z.string().min(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
  pageNumber: z.coerce.number().int().min(1).default(1),
  dataType: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
});

const FALLBACK_FOODS = {
  totalHits: 5,
  currentPage: 1,
  totalPages: 1,
  foods: [
    {
      fdcId: 2003586,
      description: "Grapefruit, raw",
      dataType: "SR Legacy",
      gtinUpc: "",
      publishedDate: "2019-04-01",
      brandOwner: "",
      ingredients: "",
      marketCountry: "United States",
      foodCategory: "Fruits and Fruit Juices",
      allHighlightFields: "",
      score: 932.4,
      foodNutrients: [
        { nutrientId: 1003, nutrientName: "Protein", nutrientNumber: "203", unitName: "G", derivationCode: "A", derivationDescription: "Analytical", value: 0.77 },
        { nutrientId: 1004, nutrientName: "Total lipid (fat)", nutrientNumber: "204", unitName: "G", derivationCode: "A", derivationDescription: "Analytical", value: 0.14 },
        { nutrientId: 1005, nutrientName: "Carbohydrate, by difference", nutrientNumber: "205", unitName: "G", derivationCode: "A", derivationDescription: "Analytical", value: 10.66 },
        { nutrientId: 1087, nutrientName: "Calcium, Ca", nutrientNumber: "301", unitName: "MG", derivationCode: "A", derivationDescription: "Analytical", value: 22 },
        { nutrientId: 1162, nutrientName: "Vitamin C, total ascorbic acid", nutrientNumber: "401", unitName: "MG", derivationCode: "A", derivationDescription: "Analytical", value: 31.2 },
      ],
    },
    {
      fdcId: 2003587,
      description: "Spinach, raw",
      dataType: "SR Legacy",
      gtinUpc: "",
      publishedDate: "2019-04-01",
      brandOwner: "",
      ingredients: "",
      marketCountry: "United States",
      foodCategory: "Vegetables and Vegetable Products",
      allHighlightFields: "",
      score: 891.2,
      foodNutrients: [
        { nutrientId: 1003, nutrientName: "Protein", nutrientNumber: "203", unitName: "G", derivationCode: "A", derivationDescription: "Analytical", value: 2.86 },
        { nutrientId: 1004, nutrientName: "Total lipid (fat)", nutrientNumber: "204", unitName: "G", derivationCode: "A", derivationDescription: "Analytical", value: 0.39 },
        { nutrientId: 1185, nutrientName: "Vitamin K (phylloquinone)", nutrientNumber: "430", unitName: "UG", derivationCode: "A", derivationDescription: "Analytical", value: 482.9 },
        { nutrientId: 1087, nutrientName: "Calcium, Ca", nutrientNumber: "301", unitName: "MG", derivationCode: "A", derivationDescription: "Analytical", value: 99 },
        { nutrientId: 1162, nutrientName: "Vitamin C, total ascorbic acid", nutrientNumber: "401", unitName: "MG", derivationCode: "A", derivationDescription: "Analytical", value: 28.1 },
      ],
    },
    {
      fdcId: 2003588,
      description: "Cheese, cheddar, aged",
      dataType: "SR Legacy",
      gtinUpc: "",
      publishedDate: "2019-04-01",
      brandOwner: "",
      ingredients: "",
      marketCountry: "United States",
      foodCategory: "Dairy and Egg Products",
      allHighlightFields: "",
      score: 845.7,
      foodNutrients: [
        { nutrientId: 1003, nutrientName: "Protein", nutrientNumber: "203", unitName: "G", derivationCode: "A", derivationDescription: "Analytical", value: 24.9 },
        { nutrientId: 1004, nutrientName: "Total lipid (fat)", nutrientNumber: "204", unitName: "G", derivationCode: "A", derivationDescription: "Analytical", value: 33.14 },
        { nutrientId: 1087, nutrientName: "Calcium, Ca", nutrientNumber: "301", unitName: "MG", derivationCode: "A", derivationDescription: "Analytical", value: 710 },
        { nutrientId: 1093, nutrientName: "Sodium, Na", nutrientNumber: "307", unitName: "MG", derivationCode: "A", derivationDescription: "Analytical", value: 621 },
      ],
    },
    {
      fdcId: 2003589,
      description: "Kale, raw",
      dataType: "SR Legacy",
      gtinUpc: "",
      publishedDate: "2019-04-01",
      brandOwner: "",
      ingredients: "",
      marketCountry: "United States",
      foodCategory: "Vegetables and Vegetable Products",
      allHighlightFields: "",
      score: 812.3,
      foodNutrients: [
        { nutrientId: 1003, nutrientName: "Protein", nutrientNumber: "203", unitName: "G", derivationCode: "A", derivationDescription: "Analytical", value: 4.28 },
        { nutrientId: 1185, nutrientName: "Vitamin K (phylloquinone)", nutrientNumber: "430", unitName: "UG", derivationCode: "A", derivationDescription: "Analytical", value: 704.8 },
        { nutrientId: 1162, nutrientName: "Vitamin C, total ascorbic acid", nutrientNumber: "401", unitName: "MG", derivationCode: "A", derivationDescription: "Analytical", value: 120 },
        { nutrientId: 1087, nutrientName: "Calcium, Ca", nutrientNumber: "301", unitName: "MG", derivationCode: "A", derivationDescription: "Analytical", value: 150 },
      ],
    },
    {
      fdcId: 2003590,
      description: "Wine, red",
      dataType: "SR Legacy",
      gtinUpc: "",
      publishedDate: "2019-04-01",
      brandOwner: "",
      ingredients: "",
      marketCountry: "United States",
      foodCategory: "Beverages",
      allHighlightFields: "",
      score: 778.9,
      foodNutrients: [
        { nutrientId: 1003, nutrientName: "Protein", nutrientNumber: "203", unitName: "G", derivationCode: "A", derivationDescription: "Analytical", value: 0.07 },
        { nutrientId: 1004, nutrientName: "Total lipid (fat)", nutrientNumber: "204", unitName: "G", derivationCode: "A", derivationDescription: "Analytical", value: 0 },
        { nutrientId: 1005, nutrientName: "Carbohydrate, by difference", nutrientNumber: "205", unitName: "G", derivationCode: "A", derivationDescription: "Analytical", value: 2.61 },
      ],
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

    const { q, pageSize, pageNumber, dataType, sortBy, sortOrder } = parsed.data;

    const usdaApiKey = "DEMO_KEY";
    const usdaUrl = new URL("https://api.nal.usda.gov/fdc/v1/foods/search");
    usdaUrl.searchParams.set("api_key", usdaApiKey);
    usdaUrl.searchParams.set("query", q);
    usdaUrl.searchParams.set("pageSize", String(pageSize));
    usdaUrl.searchParams.set("pageNumber", String(pageNumber));
    if (dataType) usdaUrl.searchParams.set("dataType", dataType);
    if (sortBy) usdaUrl.searchParams.set("sortBy", sortBy);
    if (sortOrder) usdaUrl.searchParams.set("sortOrder", sortOrder);

    const usdaRes = await fetch(usdaUrl.toString(), {
      headers: { "Accept": "application/json" },
      next: { revalidate: 3600 },
    });

    if (!usdaRes.ok) {
      return NextResponse.json(
        { ...FALLBACK_FOODS, query: q, _fallback: true },
        { headers: { "Cache-Control": "public, s-maxage=60" } }
      );
    }

    const usdaData = await usdaRes.json();

    return NextResponse.json(
      {
        totalHits: usdaData.totalHits ?? 0,
        currentPage: usdaData.currentPage ?? pageNumber,
        totalPages: usdaData.totalPages ?? 1,
        foods: Array.isArray(usdaData.foods) ? usdaData.foods : [],
        query: q,
      },
      { headers: { "Cache-Control": "public, s-maxage=3600" } }
    );
  } catch (err) {
    console.error("[food-data/search] Error:", err);
    return NextResponse.json(
      { ...FALLBACK_FOODS, _fallback: true },
      { headers: { "Cache-Control": "public, s-maxage=60" } }
    );
  }
}
