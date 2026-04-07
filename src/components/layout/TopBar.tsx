"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, X, ChevronRight, FlaskConical } from "lucide-react";
import { cn } from "@/lib/utils";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface TopBarProps {
  breadcrumbs?: BreadcrumbItem[];
  className?: string;
}

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

export function TopBar({ breadcrumbs = [], className }: TopBarProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debouncedQuery = useDebounce(query, 300);

  // Keyboard shortcut: Cmd/Ctrl+K to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
      if (e.key === "Escape") {
        inputRef.current?.blur();
        setQuery("");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleSearch = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const trimmed = query.trim();
      if (!trimmed) return;
      router.push(`/drug/${encodeURIComponent(trimmed.toLowerCase())}`);
      setQuery("");
      inputRef.current?.blur();
    },
    [query, router]
  );

  const handleClear = useCallback(() => {
    setQuery("");
    inputRef.current?.focus();
  }, []);

  return (
    <header
      className={cn(
        "flex items-center gap-4 px-5 h-14 bg-[#0f0f0f] border-b border-[#1a1a1a] shrink-0",
        className
      )}
    >
      {/* Breadcrumbs */}
      {breadcrumbs.length > 0 && (
        <nav className="flex items-center gap-1.5 text-xs text-[#555555] shrink-0">
          <FlaskConical className="w-3 h-3 text-[#333333]" />
          {breadcrumbs.map((crumb, i) => (
            <span key={i} className="flex items-center gap-1.5">
              {i > 0 && <ChevronRight className="w-3 h-3 text-[#333333]" />}
              {crumb.href ? (
                <a
                  href={crumb.href}
                  className="hover:text-[#a1a1a1] transition-colors"
                >
                  {crumb.label}
                </a>
              ) : (
                <span className="text-[#a1a1a1]">{crumb.label}</span>
              )}
            </span>
          ))}
        </nav>
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Global Drug Search */}
      <form onSubmit={handleSearch} className="relative">
        <div
          className={cn(
            "flex items-center gap-2 h-8 px-3 bg-[#0a0a0a] border transition-colors duration-150 rounded-[4px] w-[260px]",
            isFocused
              ? "border-[#333333] ring-1 ring-[#00C9A7]/20"
              : "border-[#1a1a1a] hover:border-[#222222]"
          )}
        >
          <Search className="w-3.5 h-3.5 text-[#444444] shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder="Search drug…"
            className="flex-1 bg-transparent text-xs text-white placeholder:text-[#444444] outline-none min-w-0"
            autoComplete="off"
            spellCheck={false}
          />
          {query ? (
            <button
              type="button"
              onClick={handleClear}
              className="text-[#444444] hover:text-[#a1a1a1] transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          ) : (
            <kbd className="hidden sm:inline-flex items-center gap-0.5 text-[9px] text-[#333333] font-mono border border-[#1a1a1a] rounded px-1 py-0.5">
              ⌘K
            </kbd>
          )}
        </div>

        {/* Search hint dropdown when typing */}
        {debouncedQuery.length > 0 && isFocused && (
          <div className="absolute top-full mt-1 right-0 w-full bg-[#111111] border border-[#222222] rounded-[4px] shadow-xl z-50 overflow-hidden">
            <button
              type="submit"
              className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs text-left hover:bg-[#1a1a1a] transition-colors"
            >
              <Search className="w-3.5 h-3.5 text-[#00C9A7] shrink-0" />
              <span className="text-[#a1a1a1]">
                View adverse events for{" "}
                <span className="text-white font-semibold">
                  &ldquo;{debouncedQuery}&rdquo;
                </span>
              </span>
              <ChevronRight className="w-3 h-3 text-[#444444] ml-auto shrink-0" />
            </button>
          </div>
        )}
      </form>
    </header>
  );
}
