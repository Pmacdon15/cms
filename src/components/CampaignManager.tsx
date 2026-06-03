"use client";

import { Search, X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { use, useEffect, useState } from "react";
import type { Campaign, MailingList } from "../types/types";
import { useDebounce } from "../utils/useDebounce";
import { CampaignForm } from "./CampaignForm";
import { CampaignList } from "./CampaignList";

function CampaignSearchBar({ initialSearch }: { initialSearch: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [inputValue, setInputValue] = useState(initialSearch);

  const debouncedSearch = useDebounce(inputValue, 300);

  useEffect(() => {
    setInputValue(searchParams.get("search") || "");
  }, [searchParams]);

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    if (debouncedSearch) {
      params.set("search", debouncedSearch);
    } else {
      params.delete("search");
    }
    const qs = params.toString();
    if (qs !== searchParams.toString()) {
      router.replace(qs ? `/campaigns?${qs}` : "/campaigns", { scroll: false });
    }
  }, [debouncedSearch, router, searchParams]);

  return (
    <div className="relative w-full sm:w-64">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
      <input
        type="text"
        placeholder="Search campaigns..."
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        className="w-full h-9 rounded-lg bg-white border border-zinc-200 pl-9 pr-8 py-1.5 text-xs text-zinc-900 placeholder:text-zinc-400 focus-visible:outline-none focus-visible:border-blue-500 focus-visible:ring-1 focus-visible:ring-blue-500 transition-all"
      />
      {inputValue && (
        <button
          type="button"
          onClick={() => {
            setInputValue("");
            const params = new URLSearchParams(searchParams.toString());
            params.delete("search");
            params.delete("client");
            router.replace(`/campaigns?${params.toString()}`, {
              scroll: false,
            });
          }}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition-colors cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
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
}

export default function CampaignManager({
  campaignsPromise,
  mailingListsPromise,
  hasSmsPromise,
  currentSearchPromise,
}: CampaignManagerProps) {
  const campaignsRes = use(campaignsPromise);
  const campaigns =
    campaignsRes.ok && campaignsRes.value ? campaignsRes.value : [];
  const dbError =
    !campaignsRes.ok && campaignsRes.error ? campaignsRes.error.message : null;

  const listsRes = use(mailingListsPromise);
  const mailingLists = listsRes.ok && listsRes.value ? listsRes.value : [];

  const hasSms = use(hasSmsPromise);
  const currentSearch = use(currentSearchPromise) || "";

  // Simple local filter for campaigns
  const filteredCampaigns = campaigns.filter(
    (c) =>
      c.subject?.toLowerCase().includes(currentSearch.toLowerCase()) ||
      c.content?.toLowerCase().includes(currentSearch.toLowerCase()) ||
      c.mailing_list_name
        ?.toLowerCase()
        .includes(currentSearch.toLowerCase()) ||
      c.type?.toLowerCase().includes(currentSearch.toLowerCase()),
  );

  return (
    <div className="flex flex-col gap-6">
      {/* DB Connection Alert Fallback */}
      {dbError && (
        <div className="p-4 rounded-xl border border-yellow-250 bg-yellow-50/70 text-yellow-900 text-xs">
          <span className="font-bold block mb-1">⚠️ Local Fallback Active</span>
          Failed to connect to Neon DB: {dbError}. Using simulated campaign
          databases.
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Form Composer (1/3 width) */}
        <div className="lg:col-span-1">
          <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-500 mb-4">
            Compose Marketing Message
          </h2>
          <CampaignForm mailingLists={mailingLists} hasSms={hasSms} />
        </div>

        {/* Campaign List logs (2/3 width) */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-500">
              Dispatch History & Logs
            </h2>
            <CampaignSearchBar initialSearch={currentSearch} />
          </div>
          <CampaignList initialCampaigns={filteredCampaigns} hasSms={hasSms} />
        </div>
      </div>
    </div>
  );
}
