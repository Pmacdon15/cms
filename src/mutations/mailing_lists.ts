"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  actionCreateMailingList,
  actionUpdateSubscriptionStatus,
  actionUpdateGlobalOptIn,
} from "../actions/mailing_lists";
import { showToast } from "../components/ui/toast";

/**
 * Mutation hook to create a new mailing list in AWS SES
 */
export function useCreateMailingListMutation(onSuccessCallback?: () => void) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (variables: { name: string; description?: string }) => {
      return await actionCreateMailingList(variables.name, variables.description);
    },
    onSuccess: (res) => {
      if (res.ok) {
        showToast.success("Mailing list created successfully on AWS SES.");
        queryClient.invalidateQueries({ queryKey: ["mailing-lists"] });
        if (onSuccessCallback) onSuccessCallback();
      } else {
        showToast.error(res.error || "Failed to create mailing list.");
      }
    },
    onError: (err: any) => {
      showToast.error(err?.message || "An unexpected error occurred.");
    },
  });
}

/**
 * Mutation hook to toggle subscriber status on a specific AWS SES Contact List
 */
export function useUpdateSubscriptionStatusMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (variables: {
      email: string;
      listName: string;
      status: "subscribed" | "unsubscribed";
      isPublic?: boolean;
    }) => {
      return await actionUpdateSubscriptionStatus(
        variables.email,
        variables.listName,
        variables.status,
        variables.isPublic
      );
    },
    onSuccess: (res) => {
      if (res.ok) {
        showToast.success("Preferences updated successfully.");
        queryClient.invalidateQueries({ queryKey: ["mailing-list-subscribers"] });
        queryClient.invalidateQueries({ queryKey: ["client-subscriptions"] });
      } else {
        showToast.error(res.error || "Failed to update preference.");
      }
    },
    onError: (err: any) => {
      showToast.error(err?.message || "An unexpected error occurred.");
    },
  });
}

/**
 * Mutation hook to toggle global newsletter opt-in preferences in AWS SES
 */
export function useUpdateGlobalOptInMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (variables: { email: string; optInNewsletter: boolean }) => {
      return await actionUpdateGlobalOptIn(variables.email, variables.optInNewsletter);
    },
    onSuccess: (res) => {
      if (res.ok) {
        showToast.success("Global AWS SES subscription updated.");
        queryClient.invalidateQueries({ queryKey: ["client-subscriptions"] });
        queryClient.invalidateQueries({ queryKey: ["clients"] });
      } else {
        showToast.error(res.error || "Failed to update global preference.");
      }
    },
    onError: (err: any) => {
      showToast.error(err?.message || "An unexpected error occurred.");
    },
  });
}
