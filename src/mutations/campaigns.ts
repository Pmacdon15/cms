"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { actionCreateCampaign } from "../actions/campaigns";
import { showToast } from "../components/ui/toast";
import type { CampaignInput } from "../types/types";

/**
 * Hook for dispatching a marketing campaign with reactive toast feedback
 */
export function useCreateCampaignMutation(onSuccessCallback?: () => void) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CampaignInput) => {
      const response = await actionCreateCampaign(input);
      return response;
    },
    onSuccess: (res) => {
      if (res.ok) {
        showToast.success("Campaign dispatched and processed successfully.");
        queryClient.invalidateQueries({ queryKey: ["campaigns"] });
        if (onSuccessCallback) onSuccessCallback();
      } else {
        showToast.error(res.error || "Failed to dispatch campaign.");
      }
    },
    onError: (err: Error) => {
      showToast.error(
        err?.message || "An unexpected error occurred during dispatch.",
      );
    },
  });
}
