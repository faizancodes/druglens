"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Utensils,
  FileText,
  Shield,
  Info,
} from "lucide-react";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";

// Shape returned by /api/drug-label
export interface DrugLabelData {
  drug: string;
  brandName: string;
  genericName: string;
  manufacturer: string;
  productType: string;
  route: string[];
  warnings: string[];
  foodInteractions: string[];
  drugInteractions: string[];
  indications: string[];
  contraindications: string[];
  dosageAdministration: string;
  _fallback?: boolean;
}

interface DrugLabelPanelProps {
  label: DrugLabelData | null;
  isLoading?: boolean;
}

// Food-related keywords to highlight in label text
const FOOD_KEYWORDS = [
  "food",
  "grapefruit",
  "alcohol",
  "dairy",
  "milk",
  "tyramine",
  "vitamin k",
  "vitamin c",
  "calcium",
  "iron",
  "antacid",
  "dietary",
  "meal",
  "fasting",
  "fat",
  "juice",
  "caffeine",
  "tannin",
  "fiber",
  "supplement",
  "herb",
  "st. john",
  "garlic",
  "ginger",
  "turmeric",
  "omega",
  "magnesium",
  "potassium",
  "sodium",
  "high-fat",
  "low-fat",
  "empty stomach",
  "with food",
  "without food",
  "take with",
  "avoid",
];

function highlightFoodKeywords(text: string): React.ReactNode {
  if (!text) return null;

  const pattern = new RegExp(
    `(${FOOD_KEYWORDS.map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`,
    "gi"
  );

  const parts = text.split(pattern);

  return parts.map((part, i) => {
    const isKeyword = FOOD_KEYWORDS.some(
      (k) => k.toLowerCase() === part.toLowerCase()
    );
    if (isKeyword) {
      return (
        <mark
          key={i}
          className="bg-[#00C9A7]/15 text-[#00C9A7] px-0.5 rounded-sm not-italic"
        >
          {part}
        </mark>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

interface LabelSectionDef {
  key: keyof Pick<
    DrugLabelData,
    | "warnings"
    | "drugInteractions"
    | "contraindications"
    | "foodInteractions"
    | "indications"
  >;
  title: string;
  icon: React.ElementType;
  color: string;
  priority: number;
}

const LABEL_SECTIONS: LabelSectionDef[] = [
  {
    key: "warnings",
    title: "Warnings & Precautions",
    icon: AlertTriangle,
    color: "text-[#f59e0b]",
    priority: 1,
  },
  {
    key: "drugInteractions",
    title: "Drug Interactions",
    icon: Shield,
    color: "text-[#ef4444]",
    priority: 2,
  },
  {
    key: "contraindications",
    title: "Contraindications",
    icon: AlertTriangle,
    color: "text-[#ef4444]",
    priority: 3,
  },
  {
    key: "foodInteractions",
    title: "Food & Dietary Interactions",
    icon: Utensils,
    color: "text-[#00C9A7]",
    priority: 4,
  },
  {
    key: "indications",
    title: "Indications & Usage",
    icon: FileText,
    color: "text-[#a1a1a1]",
    priority: 5,
  },
];

interface SectionPanelProps {
  section: LabelSectionDef;
  items: string[];
  defaultOpen?: boolean;
}

function SectionPanel({ section, items, defaultOpen = false }: SectionPanelProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const Icon = section.icon;

  const hasFoodMentions = useMemo(() => {
    const combined = items.join(" ").toLowerCase();
    return FOOD_KEYWORDS.some((k) => combined.includes(k));
  }, [items]);

  if (items.length === 0) return null;

  return (
    <div className="border border-[#222] overflow-hidden">
      <button
        onClick={() => setIsOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 bg-[#111] hover:bg-[#141414] transition-colors text-left"
      >
        <div className="flex items-center gap-2.5">
          <Icon className={`w-4 h-4 ${section.color} flex-shrink-0`} />
          <span className="text-sm font-medium text-[#a1a1a1]">
            {section.title}
          </span>
          <span className="text-[10px] text-[#555] border border-[#222] px-1.5 py-0.5">
            {items.length}
          </span>
          {hasFoodMentions && (
            <span className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest text-[#00C9A7] border border-[#00C9A7]/30 px-1.5 py-0.5">
              <Utensils className="w-2.5 h-2.5" />
              Food Signal
            </span>
          )}
        </div>
        {isOpen ? (
          <ChevronUp className="w-4 h-4 text-[#555] flex-shrink-0" />
        ) : (
          <ChevronDown className="w-4 h-4 text-[#555] flex-shrink-0" />
        )}
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 py-4 bg-[#0f0f0f] border-t border-[#1a1a1a] space-y-3">
              {items.map((item, i) => (
                <div key={i} className="flex gap-3">
                  <div className="w-1 flex-shrink-0 bg-[#222] mt-1" />
                  <p className="text-sm text-[#a1a1a1] leading-relaxed">
                    {highlightFoodKeywords(item)}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function DosageSection({ content }: { content: string }) {
  const [isOpen, setIsOpen] = useState(false);
  if (!content) return null;

  return (
    <div className="border border-[#222] overflow-hidden">
      <button
        onClick={() => setIsOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 bg-[#111] hover:bg-[#141414] transition-colors text-left"
      >
        <div className="flex items-center gap-2.5">
          <Info className="w-4 h-4 text-[#3D56F0] flex-shrink-0" />
          <span className="text-sm font-medium text-[#a1a1a1]">
            Dosage & Administration
          </span>
        </div>
        {isOpen ? (
          <ChevronUp className="w-4 h-4 text-[#555] flex-shrink-0" />
        ) : (
          <ChevronDown className="w-4 h-4 text-[#555] flex-shrink-0" />
        )}
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 py-4 bg-[#0f0f0f] border-t border-[#1a1a1a]">
              <p className="text-sm text-[#a1a1a1] leading-relaxed">
                {highlightFoodKeywords(content)}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function LabelSkeleton() {
  return (
    <div className="animate-pulse space-y-2">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="h-12 bg-[#111] border border-[#1a1a1a]" />
      ))}
    </div>
  );
}

export function DrugLabelPanel({ label, isLoading = false }: DrugLabelPanelProps) {
  const foodSectionCount = useMemo(() => {
    if (!label) return 0;
    return LABEL_SECTIONS.filter((s) => {
      const items = label[s.key];
      if (!Array.isArray(items)) return false;
      const combined = items.join(" ").toLowerCase();
      return FOOD_KEYWORDS.some((k) => combined.includes(k));
    }).length;
  }, [label]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader title="FDA Drug Label" subtitle="Loading label data…" />
        <CardBody>
          <LabelSkeleton />
        </CardBody>
      </Card>
    );
  }

  if (!label) {
    return (
      <Card>
        <CardHeader title="FDA Drug Label" subtitle="Official prescribing information" />
        <CardBody>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <FileText className="w-8 h-8 text-[#333] mb-3" />
            <p className="text-sm text-[#555]">No label data available</p>
            <p className="text-xs text-[#444] mt-1">
              FDA label not found for this drug
            </p>
          </div>
        </CardBody>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.2 }}
    >
      <Card>
        <CardHeader
          title="FDA Drug Label"
          subtitle="Official prescribing information"
          actions={
            foodSectionCount > 0 ? (
              <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-[#00C9A7] border border-[#00C9A7]/30 px-2 py-1">
                <Utensils className="w-3 h-3" />
                {foodSectionCount} food signal{foodSectionCount !== 1 ? "s" : ""}
              </div>
            ) : undefined
          }
        />
        <CardBody>
          <div className="space-y-1">
            {LABEL_SECTIONS.map((section, i) => {
              const items = label[section.key];
              if (!Array.isArray(items) || items.length === 0) return null;
              return (
                <SectionPanel
                  key={section.key}
                  section={section}
                  items={items}
                  defaultOpen={i === 0}
                />
              );
            })}
            <DosageSection content={label.dosageAdministration} />
          </div>

          {/* Metadata footer */}
          <div className="mt-4 pt-4 border-t border-[#1a1a1a] flex flex-wrap gap-x-6 gap-y-1 text-xs text-[#555]">
            {label.brandName && (
              <span>
                <span className="text-[#444] uppercase tracking-wider text-[10px]">
                  Brand:{" "}
                </span>
                {label.brandName}
              </span>
            )}
            {label.genericName && (
              <span>
                <span className="text-[#444] uppercase tracking-wider text-[10px]">
                  Generic:{" "}
                </span>
                {label.genericName}
              </span>
            )}
            {label.manufacturer && (
              <span>
                <span className="text-[#444] uppercase tracking-wider text-[10px]">
                  Manufacturer:{" "}
                </span>
                {label.manufacturer}
              </span>
            )}
            {label._fallback && (
              <span className="text-[#444] italic">
                (Showing sample data — FDA API unavailable)
              </span>
            )}
          </div>
        </CardBody>
      </Card>
    </motion.div>
  );
}
