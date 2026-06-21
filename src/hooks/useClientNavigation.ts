"use client";

import { useRouter, useSearchParams } from "next/navigation";
import type { Client } from "@/types/types";

export function useClientNavigation() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // const activeClientId = searchParams.get("client");

  const buildUrl = (overrides: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("search");
    params.delete("client");
    for (const [key, val] of Object.entries(overrides)) {
      if (val) params.set(key, val);
    }
    const qs = params.toString();
    return qs ? `/clients?${qs}` : "/clients";
  };

  const handleSelectClient = (client: Client) => {
    router.push(buildUrl({ client: client.id }));
  };

  const handleClear = () => {
    router.push(buildUrl({}));
  };

  return {
    buildUrl,
    handleSelectClient,
    handleClear,
  };
}
