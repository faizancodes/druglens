"use client";

import { useState, useCallback } from "react";
import { X, Plus, Pill, Search, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const PRESET_DRUGS = [
  { name: "warfarin", label: "Warfarin", category: "Anticoagulant" },
  { name: "simvastatin", label: "Simvastatin", category: "Statin" },
  { name: "atorvastatin", label: "Atorvastatin", category: "Statin" },
  { name: "metformin", label: "Metformin", category: "Antidiabetic" },
  { name: "lisinopril", label: "Lisinopril", category: "ACE Inhibitor" },
  { name: "phenelzine", label: "Phenelzine", category: "MAOI" },
  { name: "cyclosporine", label: "Cyclosporine", category: "Immunosuppressant" },
  { name: "digoxin", label: "Digoxin", category: "Cardiac Glycoside" },
  { name: "amiodarone", label: "Amiodarone", category: "Antiarrhythmic" },
  { name: "fluoxetine", label: "Fluoxetine", category: "SSRI" },
  { name: "ibuprofen", label: "Ibuprofen", category: "NSAID" },
  { name: "omeprazole", label: "Omeprazole", category: "PPI" },
];

const SLOT_COLORS = [
  { border: "border-[#00C9A7]/40", bg: "bg-[#00C9A7]/10", text: "text-[#00C9A7]", dot: "bg-[#00C9A7]" },
  { border: "border-[#3D56F0]/40", bg: "bg-[#3D56F0]/10", text: "text-[#3D56F0]", dot: "bg-[#3D56F0]" },
  { border: "border-[#f59e0b]/40", bg: "bg-[#f59e0b]/10", text: "text-[#f59e0b]", dot: "bg-[#f59e0b]" },
];

interface DrugSlotProps {
  index: number;
  drug: string | null;
  onSelect: (drug: string) => void;
  onRemove: () => void;
  canRemove: boolean;
}

function DrugSlot({ index, drug, onSelect, onRemove, canRemove }: DrugSlotProps) {
  const [open, setOpen] = useState(false);
  const [customInput, setCustomInput] = useState("");
  const color = SLOT_COLORS[index] ?? SLOT_COLORS[0];

  const handleCustomSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const trimmed = customInput.trim().toLowerCase();
      if (trimmed) {
        onSelect(trimmed);
        setCustomInput("");
        setOpen(false);
      }
    },
    [customInput, onSelect]
  );

  const handlePresetClick = useCallback(
    (name: string) => {
      onSelect(name);
      setOpen(false);
    },
    [onSelect]
  );

  return (
    <div className={cn("relative border transition-colors", drug ? color.border : "border-[#222222]", "bg-[#111111]")}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#1a1a1a]">
        <div className="flex items-center gap-2">
          <div className={cn("w-2 h-2 rounded-full", drug ? color.dot : "bg-[#333333]")} />
          <span className="text-[9px] uppercase tracking-[0.1em] text-[#555555] font-semibold">
            Drug {index + 1}
          </span>
        </div>
        {canRemove && drug && (
          <button
            onClick={onRemove}
            className="text-[#444444] hover:text-[#ef4444] transition-colors"
            aria-label="Remove drug"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        {drug ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Pill className={cn("w-4 h-4", color.text)} />
              <div>
                <p className={cn("text-sm font-semibold capitalize", color.text)}>{drug}</p>
                <p className="text-[10px] text-[#555555] mt-0.5">
                  {PRESET_DRUGS.find((d) => d.name === drug)?.category ?? "Drug"}
                </p>
              </div>
            </div>
            <button
              onClick={() => setOpen((v) => !v)}
              className="text-[10px] text-[#555555] hover:text-[#a1a1a1] flex items-center gap-1 transition-colors"
            >
              Change <ChevronDown className="w-3 h-3" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setOpen((v) => !v)}
            className="w-full flex items-center justify-center gap-2 py-4 border border-dashed border-[#333333] text-[#555555] hover:text-[#a1a1a1] hover:border-[#444444] transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span className="text-xs">Select a drug</span>
          </button>
        )}
      </div>

      {/* Dropdown */}
      {open && (
        <div className="absolute top-full left-0 right-0 z-50 bg-[#111111] border border-[#333333] shadow-2xl mt-1">
          {/* Custom search */}
          <form onSubmit={handleCustomSubmit} className="p-3 border-b border-[#1a1a1a]">
            <div className="flex items-center gap-2 bg-[#0f0f0f] border border-[#222222] px-3 py-2">
              <Search className="w-3.5 h-3.5 text-[#555555] shrink-0" />
              <input
                autoFocus
                type="text"
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                placeholder="Type drug name..."
                className="flex-1 bg-transparent text-xs text-white placeholder-[#444444] outline-none"
              />
            </div>
          </form>
          {/* Presets */}
          <div className="max-h-48 overflow-y-auto">
            {PRESET_DRUGS.map((d) => (
              <button
                key={d.name}
                onClick={() => handlePresetClick(d.name)}
                className="w-full flex items-center justify-between px-4 py-2.5 text-left hover:bg-[#1a1a1a] transition-colors"
              >
                <span className="text-xs text-[#a1a1a1] capitalize">{d.label}</span>
                <span className="text-[9px] uppercase tracking-wide text-[#444444]">{d.category}</span>
              </button>
            ))}
          </div>
          <div className="p-2 border-t border-[#1a1a1a]">
            <button
              onClick={() => setOpen(false)}
              className="w-full text-[10px] text-[#555555] hover:text-[#a1a1a1] py-1 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

interface DrugComparePanelProps {
  drugs: (string | null)[];
  onDrugsChange: (drugs: (string | null)[]) => void;
}

export function DrugComparePanel({ drugs, onDrugsChange }: DrugComparePanelProps) {
  const handleSelect = useCallback(
    (index: number, drug: string) => {
      const next = [...drugs];
      next[index] = drug;
      onDrugsChange(next);
    },
    [drugs, onDrugsChange]
  );

  const handleRemove = useCallback(
    (index: number) => {
      const next = [...drugs];
      next[index] = null;
      onDrugsChange(next);
    },
    [drugs, onDrugsChange]
  );

  const handleAddSlot = useCallback(() => {
    if (drugs.length < 3) {
      onDrugsChange([...drugs, null]);
    }
  }, [drugs, onDrugsChange]);

  const handleRemoveSlot = useCallback(
    (index: number) => {
      const next = drugs.filter((_, i) => i !== index);
      onDrugsChange(next);
    },
    [drugs, onDrugsChange]
  );

  return (
    <div className="bg-[#111111] border border-[#222222]">
      <div className="px-5 py-4 border-b border-[#222222] flex items-center justify-between">
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-[0.05em] text-[#a1a1a1]">
            Drug Selection
          </h2>
          <p className="text-[10px] text-[#555555] mt-0.5">Compare up to 3 drugs side-by-side</p>
        </div>
        {drugs.length < 3 && (
          <button
            onClick={handleAddSlot}
            className="flex items-center gap-1.5 text-[10px] text-[#00C9A7] hover:text-[#00a88c] transition-colors font-semibold uppercase tracking-wide"
          >
            <Plus className="w-3 h-3" />
            Add Drug
          </button>
        )}
      </div>

      <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {drugs.map((drug, i) => (
          <DrugSlot
            key={i}
            index={i}
            drug={drug}
            onSelect={(d) => handleSelect(i, d)}
            onRemove={() => (drugs.length > 2 ? handleRemoveSlot(i) : handleRemove(i))}
            canRemove={drugs.length > 2 || drug !== null}
          />
        ))}
      </div>
    </div>
  );
}
