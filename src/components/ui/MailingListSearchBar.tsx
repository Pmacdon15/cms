"use client";

import { Mail, Phone, Search, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useDebounce } from "../../utils/useDebounce";

export function MailingListSearchBar({
  initialSearch,
  subscribers,
  onSelectSubscriber,
  onSubmitSearch,
  onClear,
}: {
  initialSearch: string;
  subscribers: Array<{
    id: string;
    name: string;
    email: string;
    phone_number: string;
  }>;
  onSelectSubscriber?: (id: string, name: string) => void;
  onSubmitSearch?: (search: string) => void;
  onClear?: () => void;
}) {
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
    onSelectSubscriber?.(subscriber.id, subscriber.name);
  };

  const handleSearchSubmit = () => {
    setShowDropdown(false);
    setActiveIndex(-1);
    onSubmitSearch?.(inputValue.trim());
  };

  const handleClear = () => {
    setInputValue("");
    setShowDropdown(false);
    setActiveIndex(-1);
    inputRef.current?.focus();
    onClear?.();
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
    <div className="relative hidden w-full max-w-sm sm:block">
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-zinc-400" />
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
          className="h-11 w-full rounded-xl border border-zinc-200 bg-white py-2 pr-10 pl-10 text-sm text-zinc-900 transition-all placeholder:text-zinc-400 focus-visible:border-blue-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500"
        />
        {inputValue && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute top-1/2 right-3 -translate-y-1/2 cursor-pointer text-zinc-400 transition-colors hover:text-zinc-600"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Autocomplete Dropdown */}
      {showDropdown && debouncedSearch.trim().length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute top-full left-0 z-[60] mt-1.5 w-80 animate-fade-in-scale overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-xl shadow-zinc-200/60"
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
                    className={`flex w-full cursor-pointer items-start gap-2.5 px-3.5 py-2.5 text-left transition-colors ${
                      activeIndex === index
                        ? "bg-blue-50/80"
                        : "hover:bg-zinc-50"
                    }`}
                  >
                    {/* Avatar */}
                    <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 font-bold text-[10px] text-white shadow-sm">
                      {sub.name
                        .split(" ")
                        .map((w) => w[0])
                        .join("")
                        .slice(0, 2)
                        .toUpperCase()}
                    </div>
                    {/* Info */}
                    <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <span className="truncate font-semibold text-xs text-zinc-900">
                        {highlightMatch(sub.name, debouncedSearch)}
                      </span>
                      <div className="flex items-center gap-2.5 text-[11px] text-zinc-500">
                        <span className="flex items-center gap-1 truncate">
                          <Mail className="h-2.5 w-2.5 flex-shrink-0" />
                          {highlightMatch(sub.email, debouncedSearch)}
                        </span>
                        <span className="flex items-center gap-1 truncate">
                          <Phone className="h-2.5 w-2.5 flex-shrink-0" />
                          {highlightMatch(sub.phone_number, debouncedSearch)}
                        </span>
                      </div>
                    </div>
                  </button>
                </li>
              ))}
              <li className="flex items-center justify-between border-zinc-100 border-t px-3.5 py-2">
                <span className="text-[10px] text-zinc-400">
                  {suggestions.length} result
                  {suggestions.length !== 1 ? "s" : ""}
                </span>
                <span className="text-[10px] text-zinc-400">
                  <div className="rounded border border-zinc-200 bg-zinc-100 px-1 py-0.5 font-mono text-[9px]">
                    ↵
                  </div>{" "}
                  search all ·{" "}
                  <div className="rounded border border-zinc-200 bg-zinc-100 px-1 py-0.5 font-mono text-[9px]">
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
