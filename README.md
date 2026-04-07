# DrugLens

> This project was fully built by [Headstarter](https://headstarter.co) Agent — an autonomous AI coding agent.

**[Live Demo](https://druglens-cm52.projects.headstarter.co)**

DrugLens is a pharmacovigilance intelligence platform that cross-references FDA adverse event reports (FAERS), food-drug interaction signals, and nutritional composition data to uncover hidden drug safety risk patterns.

## Features

- **Drug Search & Analysis** — Search any drug to view adverse event reports, reaction breakdowns, and temporal outbreak timelines from 18M+ FDA FAERS records
- **Demographic Filtering** — Segment adverse events by age, sex, geography, and outcome to identify high-risk patient populations
- **Food-Drug Interactions** — Overlay dietary compound signals (tyramine, furanocoumarins, vitamin K, tannins) against reported adverse events
- **Drug Comparison** — Side-by-side comparison of adverse event profiles across multiple drugs
- **Risk Dashboard** — Real-time overview of top drugs by report volume, adverse event heatmaps, and recent safety alerts
- **Drug Label Intelligence** — FDA label data with highlighted food interaction warnings and contraindications
- **Explore Mode** — Browse and filter the full FAERS dataset with advanced search

## Tech Stack

- **Framework**: Next.js 15 (App Router, React 19)
- **Styling**: Tailwind CSS 3 + custom design system
- **Charts**: Recharts (timelines, heatmaps, radar charts, bar charts)
- **State**: TanStack React Query
- **Data Sources**: FDA OpenFDA API (FAERS, drug labels), USDA FoodData Central API
- **Deployment**: Netlify

## Pages

| Route | Description |
|-------|-------------|
| `/` | Landing page with drug search |
| `/drug/[name]` | Drug detail — adverse events, timeline, reactions, demographics, label |
| `/dashboard` | Risk dashboard with top drugs, heatmap, alerts |
| `/explore` | Browse and filter FAERS adverse event data |
| `/compare` | Side-by-side drug comparison |
| `/food-interactions` | Food-drug interaction analysis |

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## API Routes

| Endpoint | Description |
|----------|-------------|
| `/api/adverse-events` | Search FAERS adverse event reports by drug |
| `/api/adverse-events/demographics` | Demographic breakdown (sex, age, country, outcome) |
| `/api/adverse-events/timeline` | Temporal trend data for outbreak charts |
| `/api/drug-label` | FDA drug label information |
| `/api/drug-interactions` | Drug interaction data |
| `/api/dashboard` | Aggregated dashboard statistics |
| `/api/explore` | Full FAERS dataset search |
| `/api/food-data/search` | USDA food search |
| `/api/food-data/nutrients` | Nutritional composition data |
