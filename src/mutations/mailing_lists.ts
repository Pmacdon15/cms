"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  actionCreateMailingList,
  actionDeleteMailingList,
  actionEditMailingList,
  actionUpdateGlobalOptIn,
  actionUpdateSubscriptionStatus,
} from "../actions/mailing_lists";
import { showToast } from "../components/ui/toast";

/**
 * Mutation hook to create a new mailing list in the database
 */
export function useCreateMailingListMutation(onSuccessCallback?: () => void) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (variables: { name: string; description?: string }) => {
      return await actionCreateMailingList(
        variables.name,
        variables.description,
      );
    },
    onSuccess: (res) => {
      if (res.ok) {
        showToast.success("Mailing list created successfully.");
        queryClient.invalidateQueries({ queryKey: ["mailing-lists"] });
        if (onSuccessCallback) onSuccessCallback();
      } else {
        showToast.error(res.error || "Failed to create mailing list.");
      }
    },
    onError: (err: Error) => {
      showToast.error(err?.message || "An unexpected error occurred.");
    },
  });
}

/**
 * Mutation hook to toggle subscriber status on a specific mailing list
 */
export function useUpdateSubscriptionStatusMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (variables: {
      clientIdOrEmail: string;
      listName: string;
      status: "subscribed" | "unsubscribed";
      isPublic?: boolean;
    }) => {
      return await actionUpdateSubscriptionStatus(
        variables.clientIdOrEmail,
        variables.listName,
        variables.status,
        variables.isPublic,
      );
    },
    onSuccess: (res) => {
      if (res.ok) {
        showToast.success("Preferences updated successfully.");
        queryClient.invalidateQueries({
          queryKey: ["mailing-list-subscribers"],
        });
        queryClient.invalidateQueries({ queryKey: ["client-subscriptions"] });
      } else {
        showToast.error(res.error || "Failed to update preference.");
      }
    },
    onError: (err: Error) => {
      showToast.error(err?.message || "An unexpected error occurred.");
    },
  });
}

/**
 * Mutation hook to toggle global newsletter opt-in preferences
 */
export function useUpdateGlobalOptInMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (variables: {
      clientIdOrEmail: string;
      optInNewsletter: boolean;
    }) => {
      return await actionUpdateGlobalOptIn(
        variables.clientIdOrEmail,
        variables.optInNewsletter,
      );
    },
    onSuccess: (res) => {
      if (res.ok) {
        showToast.success("Global newsletter subscription updated.");
        queryClient.invalidateQueries({ queryKey: ["client-subscriptions"] });
        queryClient.invalidateQueries({ queryKey: ["clients"] });
      } else {
        showToast.error(res.error || "Failed to update global preference.");
      }
    },
    onError: (err: Error) => {
      showToast.error(err?.message || "An unexpected error occurred.");
    },
  });
}

/**
 * Mutation hook to delete a mailing list
 */
export function useDeleteMailingListMutation(onSuccessCallback?: () => void) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (variables: { name: string }) => {
      return await actionDeleteMailingList(variables.name);
    },
    onSuccess: (res) => {
      if (res.ok) {
        showToast.success("Mailing list deleted successfully.");
        queryClient.invalidateQueries({ queryKey: ["mailing-lists"] });
        if (onSuccessCallback) onSuccessCallback();
      } else {
        showToast.error(res.error || "Failed to delete mailing list.");
      }
    },
    onError: (err: Error) => {
      showToast.error(err?.message || "An unexpected error occurred.");
    },
  });
}

/**
 * Mutation hook to edit/rename a mailing list
 */
export function useEditMailingListMutation(onSuccessCallback?: () => void) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (variables: {
      oldName: string;
      newName: string;
      description?: string;
    }) => {
      return await actionEditMailingList(
        variables.oldName,
        variables.newName,
        variables.description,
      );
    },
    onSuccess: (res) => {
      if (res.ok) {
        showToast.success("Mailing list updated successfully.");
        queryClient.invalidateQueries({ queryKey: ["mailing-lists"] });
        if (onSuccessCallback) onSuccessCallback();
      } else {
        showToast.error(res.error || "Failed to update mailing list.");
      }
    },
    onError: (err: Error) => {
      showToast.error(err?.message || "An unexpected error occurred.");
    },
  });
}
