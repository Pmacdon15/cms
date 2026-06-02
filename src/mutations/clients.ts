"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  actionCreateClient,
  actionDeleteClient,
  actionUpdateClientOptIn,
} from "../actions/clients";
import { showToast } from "../components/ui/toast";
import type { ClientInput } from "../types/types";

/**
 * Hook for creating a new client with reactive toast feedback
 */
export function useCreateClientMutation(onSuccessCallback?: () => void) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: ClientInput) => {
      const response = await actionCreateClient(input);
      return response;
    },
    onSuccess: (res) => {
      if (res.ok) {
        showToast.success("Client added successfully.");
        queryClient.invalidateQueries({ queryKey: ["clients"] });
        if (onSuccessCallback) onSuccessCallback();
      } else {
        showToast.error(res.error || "Failed to create client.");
      }
    },
    onError: (err: any) => {
      showToast.error(err?.message || "An unexpected error occurred.");
    },
  });
}

/**
 * Hook for updating channel opt-in states with reactive toast feedback
 */
export function useUpdateClientOptInMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (variables: {
      id: string;
      optInNewsletter: boolean;
      optInSms: boolean;
    }) => {
      const response = await actionUpdateClientOptIn(
        variables.id,
        variables.optInNewsletter,
        variables.optInSms,
      );
      return response;
    },
    onSuccess: (res) => {
      if (res.ok) {
        showToast.success("Contact subscriptions updated successfully.");
        queryClient.invalidateQueries({ queryKey: ["clients"] });
      } else {
        showToast.error(res.error || "Failed to update subscriptions.");
      }
    },
    onError: (err: any) => {
      showToast.error(err?.message || "An unexpected error occurred.");
    },
  });
}

/**
 * Hook for deleting a client with reactive toast feedback
 */
export function useDeleteClientMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await actionDeleteClient(id);
      return response;
    },
    onSuccess: (res) => {
      if (res.ok) {
        showToast.success("Client removed successfully.");
        queryClient.invalidateQueries({ queryKey: ["clients"] });
      } else {
        showToast.error(res.error || "Failed to remove client.");
      }
    },
    onError: (err: any) => {
      showToast.error(err?.message || "An unexpected error occurred.");
    },
  });
}
