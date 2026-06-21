"use client";

import { Search, X } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  startTransition,
  use,
  useEffect,
  useOptimistic,
  useRef,
  useState,
} from "react";
import type { Campaign, Client, MailingList } from "../types/types";
import { useDebounce } from "../utils/useDebounce";
import { CampaignForm } from "./CampaignForm";
import { CampaignList } from "./CampaignList";

function CampaignSearchBar({
  initialSearch,
  selectedClientName,
  onSearch,
  onClear,
}: {
  initialSearch: string;
  selectedClientName?: string;
  onSearch?: (query: string) => void;
  onClear?: () => void;
}) {
  const router = useRouter();
  const [inputValue, setInputValue] = useState(
    selectedClientName || initialSearch,
  );

  const debouncedSearch = useDebounce(inputValue, 300);
  const lastUpdatedValueRef = useRef(selectedClientName || initialSearch);

  // Update URL with debounced value if it's different from the last updated URL state
  useEffect(() => {
    if (debouncedSearch === lastUpdatedValueRef.current) {
      return;
    }
    const params = new URLSearchParams(window.location.search);
    if (debouncedSearch) {
      if (selectedClientName && debouncedSearch !== selectedClientName) {
        params.delete("client");
      }
      params.set("search", debouncedSearch);
    } else {
      params.delete("search");
      params.delete("client");
    }
    const qs = params.toString();
    lastUpdatedValueRef.current = debouncedSearch;

    startTransition(() => {
      if (debouncedSearch) {
        onSearch?.(debouncedSearch);
      } else {
        onClear?.();
      }
      router.replace(qs ? `/campaigns?${qs}` : "/campaigns", { scroll: false });
    });
  }, [debouncedSearch, router, selectedClientName, onSearch, onClear]);

  return (
    <div className="relative w-full sm:w-64">
      <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-zinc-400" />
      <input
        type="text"
        placeholder="Search campaigns..."
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        className="h-9 w-full rounded-lg border border-zinc-200 bg-white py-1.5 pr-8 pl-9 text-xs text-zinc-900 transition-all placeholder:text-zinc-400 focus-visible:border-blue-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500"
      />
      {inputValue && (
        <button
          type="button"
          onClick={() => {
            setInputValue("");
            lastUpdatedValueRef.current = "";
            const params = new URLSearchParams(window.location.search);
            params.delete("search");
            params.delete("client");
            startTransition(() => {
              onClear?.();
              router.replace(
                params.toString()
                  ? `/campaigns?${params.toString()}`
                  : "/campaigns",
                {
                  scroll: false,
                },
              );
            });
          }}
          className="absolute top-1/2 right-2.5 -translate-y-1/2 cursor-pointer text-zinc-400 transition-colors hover:text-zinc-600"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}

interface CampaignManagerProps {
  campaignsPromise: Promise<{
    ok: boolean;
    value?: Campaign[];
    error?: unknown;
  }>;
  mailingListsPromise: Promise<{
    ok: boolean;
    value?: MailingList[];
    error?: unknown;
  }>;
  hasSmsPromise: Promise<boolean>;
  currentSearchPromise: Promise<string>;
  selectedClientPromise?: Promise<Client | null>;
}

export default function CampaignManager({
  campaignsPromise,
  mailingListsPromise,
  hasSmsPromise,
  currentSearchPromise,
  selectedClientPromise,
}: CampaignManagerProps) {
  const campaigns = use(campaignsPromise);

  const listsRes = use(mailingListsPromise);
  const mailingLists = listsRes.ok && listsRes.value ? listsRes.value : [];

  const hasSms = use(hasSmsPromise);
  const currentSearch = use(currentSearchPromise) || "";
  const selectedClient = selectedClientPromise
    ? use(selectedClientPromise)
    : null;

  const [optimisticState, setOptimisticState] = useOptimistic(
    {
      currentSearch,
      selectedClient,
    },
    (state, action: { type: "search"; query: string } | { type: "clear" }) => {
      if (action.type === "search") {
        return {
          ...state,
          currentSearch: action.query,
          selectedClient: null,
        };
      }
      if (action.type === "clear") {
        return {
          ...state,
          currentSearch: "",
          selectedClient: null,
        };
      }
      return state;
    },
  );

  const handleSearch = (query: string) => {
    setOptimisticState({ type: "search", query });
  };

  const handleClear = () => {
    setOptimisticState({ type: "clear" });
  };

  const filteredCampaigns =
    campaigns.ok && campaigns.value
      ? campaigns.value.filter((c) => {
          if (
            optimisticState.selectedClient &&
            optimisticState.currentSearch ===
              optimisticState.selectedClient.name
          ) {
            return true;
          }
          if (!optimisticState.currentSearch) return true;
          return (
            c.subject
              ?.toLowerCase()
              .includes(optimisticState.currentSearch.toLowerCase()) ||
            c.content
              ?.toLowerCase()
              .includes(optimisticState.currentSearch.toLowerCase()) ||
            c.mailing_list_name
              ?.toLowerCase()
              .includes(optimisticState.currentSearch.toLowerCase()) ||
            c.type
              ?.toLowerCase()
              .includes(optimisticState.currentSearch.toLowerCase())
          );
        })
      : [];

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-3">
        {/* Form Composer (1/3 width) */}
        <div className="lg:col-span-1">
          <h2 className="mb-4 font-bold text-sm text-zinc-550 uppercase tracking-wider">
            Compose Marketing Message
          </h2>
          <CampaignForm mailingLists={mailingLists} hasSms={hasSms} />
        </div>

        {/* Campaign List logs (2/3 width) */}
        <div className="flex flex-col gap-4 lg:col-span-2">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <h2 className="font-bold text-sm text-zinc-550 uppercase tracking-wider">
              Dispatch History & Logs
            </h2>
            <CampaignSearchBar
              key={`${optimisticState.currentSearch}-${
                optimisticState.selectedClient?.id || ""
              }`}
              initialSearch={
                optimisticState.selectedClient
                  ? optimisticState.selectedClient.name
                  : optimisticState.currentSearch
              }
              selectedClientName={optimisticState.selectedClient?.name}
              onSearch={handleSearch}
              onClear={handleClear}
            />
          </div>
          <CampaignList initialCampaigns={filteredCampaigns} hasSms={hasSms} />
        </div>
      </div>
    </div>
  );
}
