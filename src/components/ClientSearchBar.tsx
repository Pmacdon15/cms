"use client";

import { useQuery } from "@tanstack/react-query";
import { Mail, Phone, Search, X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { actionSearchClients } from "../actions/clients";
import type { Client } from "../types/types";
import { useDebounce } from "../utils/useDebounce";

/**
 * Global client autocomplete search bar for the Navbar.
 * - Typing triggers debounced autocomplete suggestions via TanStack Query.
 * - Clicking a suggestion navigates to /clients?client=ID (optimistic detail view).
 * - Pressing Enter navigates to /clients?search=TERM (full table search).
 */
export function ClientSearchBar({ selectedClientName }: { selectedClientName?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [inputValue, setInputValue] = useState(
    searchParams.get("search") || "",
  );
  const [showDropdown, setShowDropdown] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const debouncedSearch = useDebounce(inputValue, 300);

  // Sync input value with URL search param changes (e.g. back/forward navigation)
  useEffect(() => {
    const s = searchParams.get("search") || "";
    const c = searchParams.get("client");
    if (c && selectedClientName) {
      setInputValue(selectedClientName);
    } else if (!c) {
      setInputValue(s);
    }
  }, [searchParams, selectedClientName]);

  // Autocomplete suggestions
  const { data: suggestions = [], isFetching: isSearching } = useQuery({
    queryKey: ["client-search-nav", debouncedSearch],
    queryFn: async () => {
      if (!debouncedSearch.trim()) return [];
      const res = await actionSearchClients(debouncedSearch.trim());
      if (res.ok) return res.value as Client[];
      return [];
    },
    enabled: debouncedSearch.trim().length > 0 && showDropdown,
    staleTime: 1000 * 30,
  });

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
        setActiveIndex(-1);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectClient = (client: Client) => {
    setInputValue(client.name);
    setShowDropdown(false);
    setActiveIndex(-1);
    router.push(`/clients?client=${client.id}`);
  };

  const handleSearchSubmit = () => {
    setShowDropdown(false);
    setActiveIndex(-1);
    if (inputValue.trim()) {
      router.push(`/clients?search=${encodeURIComponent(inputValue.trim())}`);
    } else {
      router.push("/clients");
    }
  };

  const handleClear = () => {
    setInputValue("");
    setShowDropdown(false);
    setActiveIndex(-1);
    inputRef.current?.focus();
    router.push("/clients");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown || suggestions.length === 0) {
      if (e.key === "Enter") {
        e.preventDefault();
        handleSearchSubmit();
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setActiveIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : 0,
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setActiveIndex((prev) =>
          prev > 0 ? prev - 1 : suggestions.length - 1,
        );
        break;
      case "Enter":
        e.preventDefault();
        if (activeIndex >= 0 && activeIndex < suggestions.length) {
          handleSelectClient(suggestions[activeIndex]);
        } else {
          handleSearchSubmit();
        }
        break;
      case "Escape":
        setShowDropdown(false);
        setActiveIndex(-1);
        break;
    }
  };

  const highlightMatch = (text: string, query: string) => {
    if (!query.trim()) return text;
    const idx = text.toLowerCase().indexOf(query.toLowerCase());
    if (idx === -1) return text;
    return (
      <>
        {text.slice(0, idx)}
        <span className="font-bold text-blue-600">{text.slice(idx, idx + query.length)}</span>
        {text.slice(idx + query.length)}
      </>
    );
  };

  return (
    <div className="relative hidden md:block">
      {/* Compact Search Input */}
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none">
          {isSearching ? (
            <div className="w-3.5 h-3.5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
          ) : (
            <Search className="w-3.5 h-3.5" />
          )}
        </div>
        <input
          ref={inputRef}
          id="global-client-search"
          type="text"
          placeholder="Search clients..."
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            setShowDropdown(true);
            setActiveIndex(-1);
          }}
          onFocus={() => {
            if (inputValue.trim()) setShowDropdown(true);
          }}
          onKeyDown={handleKeyDown}
          autoComplete="off"
          className="w-56 lg:w-72 h-9 rounded-lg bg-zinc-50 border border-zinc-200 pl-9 pr-8 py-1.5 text-xs text-zinc-900 placeholder:text-zinc-400 focus-visible:outline-none focus-visible:border-blue-500 focus-visible:ring-2 focus-visible:ring-blue-500/20 focus-visible:bg-white transition-all"
        />
        {inputValue && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Autocomplete Dropdown */}
      {showDropdown && debouncedSearch.trim().length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-[60] top-full left-0 mt-1.5 w-80 bg-white border border-zinc-200 rounded-xl shadow-xl shadow-zinc-200/60 overflow-hidden animate-fade-in-scale"
        >
          {suggestions.length === 0 && !isSearching && (
            <div className="px-4 py-5 text-center text-xs text-zinc-400">
              No clients found matching &ldquo;{debouncedSearch}&rdquo;
            </div>
          )}
          {suggestions.length === 0 && isSearching && (
            <div className="px-4 py-5 text-center text-xs text-zinc-400">
              Searching...
            </div>
          )}
          {suggestions.length > 0 && (
            <ul className="max-h-64 overflow-y-auto py-1">
              {suggestions.map((client, index) => (
                <li key={client.id}>
                  <button
                    type="button"
                    onClick={() => handleSelectClient(client)}
                    onMouseEnter={() => setActiveIndex(index)}
                    className={`w-full text-left px-3.5 py-2.5 flex items-start gap-2.5 transition-colors cursor-pointer ${
                      activeIndex === index
                        ? "bg-blue-50/80"
                        : "hover:bg-zinc-50"
                    }`}
                  >
                    {/* Avatar */}
                    <div className="w-8 h-8 mt-0.5 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-[10px] flex-shrink-0 shadow-sm">
                      {client.name
                        .split(" ")
                        .map((w) => w[0])
                        .join("")
                        .slice(0, 2)
                        .toUpperCase()}
                    </div>
                    {/* Info */}
                    <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                      <span className="text-xs font-semibold text-zinc-900 truncate">
                        {highlightMatch(client.name, debouncedSearch)}
                      </span>
                      <div className="flex items-center gap-2.5 text-[11px] text-zinc-500">
                        <span className="flex items-center gap-1 truncate">
                          <Mail className="w-2.5 h-2.5 flex-shrink-0" />
                          {highlightMatch(client.email, debouncedSearch)}
                        </span>
                        <span className="flex items-center gap-1 truncate">
                          <Phone className="w-2.5 h-2.5 flex-shrink-0" />
                          {highlightMatch(client.phone_number, debouncedSearch)}
                        </span>
                      </div>
                    </div>
                  </button>
                </li>
              ))}
              {/* Footer hint */}
              <li className="px-3.5 py-2 border-t border-zinc-100 flex items-center justify-between">
                <span className="text-[10px] text-zinc-400">
                  {suggestions.length} result{suggestions.length !== 1 ? "s" : ""}
                </span>
                <span className="text-[10px] text-zinc-400">
                  <kbd className="px-1 py-0.5 bg-zinc-100 border border-zinc-200 rounded text-[9px] font-mono">
                    ↵
                  </kbd>{" "}
                  search all ·{" "}
                  <kbd className="px-1 py-0.5 bg-zinc-100 border border-zinc-200 rounded text-[9px] font-mono">
                    ↑↓
                  </kbd>{" "}
                  navigate
                </span>
              </li>
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
export default ClientSearchBar;
