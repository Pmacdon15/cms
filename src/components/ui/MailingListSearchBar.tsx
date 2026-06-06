"use client";

import { Mail, Phone, Search, X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { useDebounce } from "../../utils/useDebounce";

export function MailingListSearchBar({
  initialSearch,
  subscribers,
}: {
  initialSearch: string;
  subscribers: Array<{
    id: string;
    name: string;
    email: string;
    phone_number: string;
  }>;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const getNameForSearch = useCallback(
    (s: string) => {
      if (!s) return "";
      const match = subscribers.find((sub) => sub.id === s);
      return match ? match.name : s;
    },
    [subscribers],
  );

  const [inputValue, setInputValue] = useState(() =>
    getNameForSearch(initialSearch),
  );
  const [showDropdown, setShowDropdown] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const debouncedSearch = useDebounce(inputValue, 300);

  // Sync when URL changes externally
  useEffect(() => {
    const s = searchParams.get("client") || searchParams.get("search") || "";
    setInputValue(getNameForSearch(s));
  }, [searchParams, getNameForSearch]);

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

  const suggestions = debouncedSearch.trim()
    ? subscribers.filter(
        (sub) =>
          sub.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
          sub.email.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
          sub.phone_number.includes(debouncedSearch),
      )
    : [];

  const handleSelectSubscriber = (subscriber: { id: string; name: string }) => {
    setInputValue(subscriber.name);
    setShowDropdown(false);
    setActiveIndex(-1);

    const params = new URLSearchParams(searchParams.toString());
    params.set("client", subscriber.id);
    params.delete("search");
    router.replace(`/mailing-lists?${params.toString()}`, { scroll: false });
  };

  const handleSearchSubmit = () => {
    setShowDropdown(false);
    setActiveIndex(-1);

    const params = new URLSearchParams(searchParams.toString());
    if (inputValue.trim()) {
      params.set("search", inputValue.trim());
      params.delete("client");
    } else {
      params.delete("search");
      params.delete("client");
    }

    if (params.toString() !== searchParams.toString()) {
      router.replace(`/mailing-lists?${params.toString()}`, { scroll: false });
    }
  };

  const handleClear = () => {
    setInputValue("");
    setShowDropdown(false);
    setActiveIndex(-1);
    inputRef.current?.focus();

    const params = new URLSearchParams(searchParams.toString());
    params.delete("search");
    params.delete("client");
    router.replace(`/mailing-lists?${params.toString()}`, { scroll: false });
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
          handleSelectSubscriber(suggestions[activeIndex]);
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
        <span className="font-bold text-blue-600">
          {text.slice(idx, idx + query.length)}
        </span>
        {text.slice(idx + query.length)}
      </>
    );
  };

  return (
    <div className="relative w-full max-w-sm hidden sm:block">
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          placeholder="Search subscribers..."
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
          className="w-full h-11 rounded-xl bg-white border border-zinc-200 pl-10 pr-10 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus-visible:outline-none focus-visible:border-blue-500 focus-visible:ring-1 focus-visible:ring-blue-500 transition-all"
        />
        {inputValue && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Autocomplete Dropdown */}
      {showDropdown && debouncedSearch.trim().length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-[60] top-full left-0 mt-1.5 w-80 bg-white border border-zinc-200 rounded-xl shadow-xl shadow-zinc-200/60 overflow-hidden animate-fade-in-scale"
        >
          {suggestions.length === 0 && (
            <div className="px-4 py-5 text-center text-xs text-zinc-400">
              No subscribers found matching &ldquo;{debouncedSearch}&rdquo;
            </div>
          )}
          {suggestions.length > 0 && (
            <ul className="max-h-64 overflow-y-auto py-1">
              {suggestions.map((sub, index) => (
                <li key={sub.id}>
                  <button
                    type="button"
                    onClick={() => handleSelectSubscriber(sub)}
                    onMouseEnter={() => setActiveIndex(index)}
                    className={`w-full text-left px-3.5 py-2.5 flex items-start gap-2.5 transition-colors cursor-pointer ${
                      activeIndex === index
                        ? "bg-blue-50/80"
                        : "hover:bg-zinc-50"
                    }`}
                  >
                    {/* Avatar */}
                    <div className="w-8 h-8 mt-0.5 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-[10px] flex-shrink-0 shadow-sm">
                      {sub.name
                        .split(" ")
                        .map((w) => w[0])
                        .join("")
                        .slice(0, 2)
                        .toUpperCase()}
                    </div>
                    {/* Info */}
                    <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                      <span className="text-xs font-semibold text-zinc-900 truncate">
                        {highlightMatch(sub.name, debouncedSearch)}
                      </span>
                      <div className="flex items-center gap-2.5 text-[11px] text-zinc-500">
                        <span className="flex items-center gap-1 truncate">
                          <Mail className="w-2.5 h-2.5 flex-shrink-0" />
                          {highlightMatch(sub.email, debouncedSearch)}
                        </span>
                        <span className="flex items-center gap-1 truncate">
                          <Phone className="w-2.5 h-2.5 flex-shrink-0" />
                          {highlightMatch(sub.phone_number, debouncedSearch)}
                        </span>
                      </div>
                    </div>
                  </button>
                </li>
              ))}
              <li className="px-3.5 py-2 border-t border-zinc-100 flex items-center justify-between">
                <span className="text-[10px] text-zinc-400">
                  {suggestions.length} result
                  {suggestions.length !== 1 ? "s" : ""}
                </span>
                <span className="text-[10px] text-zinc-400">
                  <div className="px-1 py-0.5 bg-zinc-100 border border-zinc-200 rounded text-[9px] font-mono">
                    ↵
                  </div>{" "}
                  search all ·{" "}
                  <div className="px-1 py-0.5 bg-zinc-100 border border-zinc-200 rounded text-[9px] font-mono">
                    ↑↓
                  </div>{" "}
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
