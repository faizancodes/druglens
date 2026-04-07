"use client";

import { useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  FlaskConical,
  Search,
  ArrowRight,
  Activity,
  Salad,
  Users,
  ShieldAlert,
  TrendingUp,
  Database,
  ChevronRight,
  Pill,
} from "lucide-react";
import { cn } from "@/lib/utils";

const FEATURE_CARDS = [
  {
    icon: <Activity className="w-5 h-5" />,
    title: "Adverse Event Analysis",
    description:
      "Explore FDA FAERS adverse event reports with temporal outbreak charts, demographic breakdowns, and reaction heatmaps across thousands of drug-event pairs.",
    accent: "#00C9A7",
    badge: "FDA FAERS",
  },
  {
    icon: <Salad className="w-5 h-5" />,
    title: "Food-Drug Interactions",
    description:
      "Overlay dietary compound signals — tyramine, furanocoumarins, vitamin K, tannins — against reported adverse events to reveal hidden pharmacokinetic risk patterns.",
    accent: "#3D56F0",
    badge: "USDA FDC",
  },
  {
    icon: <Users className="w-5 h-5" />,
    title: "Demographic Filtering",
    description:
      "Segment adverse event cohorts by age group, sex, and geography. Identify which patient populations carry the highest risk burden for any drug-food combination.",
    accent: "#f59e0b",
    badge: "Cohort Analysis",
  },
];

const STAT_ITEMS = [
  { value: "18M+", label: "FAERS Reports" },
  { value: "400K+", label: "Food Items" },
  { value: "1,200+", label: "Interaction Signals" },
  { value: "Real-time", label: "FDA Data" },
];

const EXAMPLE_DRUGS = [
  "warfarin",
  "simvastatin",
  "metformin",
  "lisinopril",
  "atorvastatin",
  "phenelzine",
];

export default function Home() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSearch = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const trimmed = query.trim();
      if (!trimmed) return;
      router.push(`/drug/${encodeURIComponent(trimmed.toLowerCase())}`);
    },
    [query, router]
  );

  const handleExampleClick = useCallback(
    (drug: string) => {
      router.push(`/drug/${encodeURIComponent(drug)}`);
    },
    [router]
  );

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col">
      {/* Top nav bar */}
      <nav className="flex items-center justify-between px-8 py-4 border-b border-[#1a1a1a]">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-[#00C9A7] flex items-center justify-center">
            <FlaskConical className="w-4 h-4 text-[#0a0a0a]" />
          </div>
          <span className="text-sm font-bold tracking-tight">
            Drug<span className="text-[#00C9A7]">lens</span>
          </span>
          <span className="hidden sm:inline-flex text-[9px] uppercase tracking-[0.1em] text-[#555555] font-semibold border border-[#1a1a1a] px-2 py-0.5 rounded-[2px] ml-1">
            Beta
          </span>
        </div>
        <div className="flex items-center gap-3">
          <a
            href="/dashboard"
            className="text-xs text-[#666666] hover:text-[#a1a1a1] transition-colors"
          >
            Dashboard
          </a>
          <a
            href="/explore"
            className="text-xs text-[#666666] hover:text-[#a1a1a1] transition-colors"
          >
            Explore
          </a>
          <a
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-xs font-bold bg-[#00C9A7] text-[#0a0a0a] px-3 py-1.5 rounded-[4px] hover:bg-[#00a88c] transition-colors"
          >
            Open App
            <ArrowRight className="w-3 h-3" />
          </a>
        </div>
      </nav>

      {/* Hero section */}
      <section className="flex-1 flex flex-col items-center justify-center px-6 py-24 text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.1em] text-[#00C9A7] bg-[#00C9A7]/10 border border-[#00C9A7]/20 px-3 py-1.5 rounded-[4px] mb-8">
          <ShieldAlert className="w-3.5 h-3.5" />
          Pharmacovigilance Intelligence Platform
        </div>

        {/* Headline */}
        <h1 className="max-w-3xl text-4xl sm:text-5xl lg:text-6xl font-light text-white leading-[1.1] tracking-tight mb-6">
          Uncover hidden{" "}
          <span className="text-[#00C9A7]">drug-food risk</span>
          <br />
          patterns in FDA data
        </h1>

        {/* Subheadline */}
        <p className="max-w-xl text-base text-[#666666] leading-relaxed mb-10">
          Cross-reference FDA adverse event reports with USDA nutritional data
          to reveal how dietary compounds amplify or suppress drug safety
          signals — insights no single API provides alone.
        </p>

        {/* Drug search */}
        <form
          onSubmit={handleSearch}
          className="w-full max-w-lg mb-4"
        >
          <div
            className={cn(
              "flex items-center gap-3 h-12 px-4 bg-[#111111] border transition-all duration-200 rounded-[4px]",
              isFocused
                ? "border-[#00C9A7]/50 ring-2 ring-[#00C9A7]/10"
                : "border-[#222222] hover:border-[#333333]"
            )}
          >
            <Search className="w-4 h-4 text-[#444444] shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder="Search a drug — e.g. warfarin, simvastatin…"
              className="flex-1 bg-transparent text-sm text-white placeholder:text-[#444444] outline-none"
              autoComplete="off"
              spellCheck={false}
            />
            <button
              type="submit"
              disabled={!query.trim()}
              className={cn(
                "shrink-0 flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-[4px] transition-colors",
                query.trim()
                  ? "bg-[#00C9A7] text-[#0a0a0a] hover:bg-[#00a88c]"
                  : "bg-[#1a1a1a] text-[#444444] cursor-not-allowed"
              )}
            >
              Analyze
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </form>

        {/* Example drugs */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-12">
          <span className="text-[10px] uppercase tracking-[0.08em] text-[#444444] font-semibold">
            Try:
          </span>
          {EXAMPLE_DRUGS.map((drug) => (
            <button
              key={drug}
              type="button"
              onClick={() => handleExampleClick(drug)}
              className="text-[11px] text-[#666666] hover:text-[#00C9A7] border border-[#1a1a1a] hover:border-[#00C9A7]/30 px-2.5 py-1 rounded-[4px] transition-colors capitalize"
            >
              {drug}
            </button>
          ))}
        </div>

        {/* CTA buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3">
          <a
            href="/dashboard"
            className="inline-flex items-center gap-2 text-sm font-bold bg-[#00C9A7] text-[#0a0a0a] px-5 py-2.5 rounded-[4px] hover:bg-[#00a88c] transition-colors"
          >
            <TrendingUp className="w-4 h-4" />
            Open Dashboard
          </a>
          <a
            href="/explore"
            className="inline-flex items-center gap-2 text-sm font-medium text-[#a1a1a1] border border-[#222222] hover:border-[#333333] hover:text-white px-5 py-2.5 rounded-[4px] transition-colors"
          >
            <Database className="w-4 h-4" />
            Explore Data
          </a>
        </div>
      </section>

      {/* Stats bar */}
      <section className="border-y border-[#1a1a1a] bg-[#0f0f0f]">
        <div className="max-w-4xl mx-auto px-6 py-6 grid grid-cols-2 sm:grid-cols-4 gap-6">
          {STAT_ITEMS.map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-xl font-light text-[#00C9A7] mb-0.5">
                {stat.value}
              </div>
              <div className="text-[10px] uppercase tracking-[0.08em] text-[#555555] font-semibold">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Feature cards */}
      <section className="max-w-5xl mx-auto px-6 py-20 w-full">
        <div className="text-center mb-12">
          <p className="text-[10px] uppercase tracking-[0.1em] text-[#555555] font-semibold mb-3">
            Platform Capabilities
          </p>
          <h2 className="text-2xl font-light text-white">
            Built for pharmacovigilance professionals
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-[#1a1a1a]">
          {FEATURE_CARDS.map((card) => (
            <div
              key={card.title}
              className="bg-[#0f0f0f] p-8 group hover:bg-[#111111] transition-colors"
            >
              <div
                className="w-9 h-9 flex items-center justify-center mb-5"
                style={{ backgroundColor: `${card.accent}15`, color: card.accent }}
              >
                {card.icon}
              </div>
              <div className="flex items-center gap-2 mb-3">
                <h3 className="text-sm font-semibold text-white">
                  {card.title}
                </h3>
                <span
                  className="text-[8px] font-bold uppercase tracking-[0.08em] px-1.5 py-0.5 rounded-[2px]"
                  style={{
                    backgroundColor: `${card.accent}15`,
                    color: card.accent,
                  }}
                >
                  {card.badge}
                </span>
              </div>
              <p className="text-xs text-[#666666] leading-relaxed">
                {card.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="border-t border-[#1a1a1a] bg-[#0f0f0f]">
        <div className="max-w-4xl mx-auto px-6 py-16">
          <div className="text-center mb-10">
            <p className="text-[10px] uppercase tracking-[0.1em] text-[#555555] font-semibold mb-3">
              Workflow
            </p>
            <h2 className="text-2xl font-light text-white">
              From raw FAERS data to actionable insights
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                icon: <Pill className="w-4 h-4" />,
                title: "Select a Drug",
                desc: "Search any FDA-approved drug to pull its complete adverse event history from FAERS.",
              },
              {
                step: "02",
                icon: <Activity className="w-4 h-4" />,
                title: "Analyze Events",
                desc: "View temporal outbreak charts, demographic cohorts, and reaction severity breakdowns.",
              },
              {
                step: "03",
                icon: <Salad className="w-4 h-4" />,
                title: "Overlay Food Signals",
                desc: "Cross-reference dietary compound concentrations with adverse event clusters to surface interaction risks.",
              },
            ].map((step) => (
              <div key={step.step} className="flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-bold text-[#333333] font-mono">
                    {step.step}
                  </span>
                  <div className="h-px flex-1 bg-[#1a1a1a]" />
                </div>
                <div className="w-8 h-8 bg-[#111111] border border-[#222222] flex items-center justify-center text-[#00C9A7]">
                  {step.icon}
                </div>
                <h3 className="text-sm font-semibold text-white">{step.title}</h3>
                <p className="text-xs text-[#555555] leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA footer */}
      <section className="border-t border-[#1a1a1a]">
        <div className="max-w-4xl mx-auto px-6 py-16 text-center">
          <h2 className="text-2xl font-light text-white mb-4">
            Ready to investigate?
          </h2>
          <p className="text-sm text-[#555555] mb-8 max-w-md mx-auto">
            Start with the dashboard for an overview, or search a specific drug
            to dive straight into its adverse event profile.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <a
              href="/dashboard"
              className="inline-flex items-center gap-2 text-sm font-bold bg-[#00C9A7] text-[#0a0a0a] px-6 py-3 rounded-[4px] hover:bg-[#00a88c] transition-colors"
            >
              Go to Dashboard
              <ChevronRight className="w-4 h-4" />
            </a>
            <a
              href="/food-interactions"
              className="inline-flex items-center gap-2 text-sm font-medium text-[#a1a1a1] border border-[#222222] hover:border-[#333333] hover:text-white px-6 py-3 rounded-[4px] transition-colors"
            >
              <Salad className="w-4 h-4" />
              Food Interactions
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#1a1a1a] px-8 py-5">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-[#00C9A7] flex items-center justify-center">
              <FlaskConical className="w-3 h-3 text-[#0a0a0a]" />
            </div>
            <span className="text-xs font-bold text-[#555555]">
              Drug<span className="text-[#00C9A7]">lens</span>
            </span>
          </div>
          <p className="text-[10px] text-[#333333] text-center">
            Data sourced from FDA OpenFDA API, USDA FoodData Central, and Open
            Food Facts. For research purposes only.
          </p>
          <div className="flex items-center gap-4">
            <span className="text-[10px] text-[#333333]">FDA FAERS</span>
            <span className="text-[10px] text-[#333333]">USDA FDC</span>
            <span className="text-[10px] text-[#333333]">Open Food Facts</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
