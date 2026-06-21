"use client";

import { BellOff, CheckCircle, Layers, Mail } from "lucide-react";
import { use, useState } from "react";
import { Checkbox } from "../../components/ui/checkbox";
import {
  useUpdateGlobalOptInMutation,
  useUpdateSubscriptionStatusMutation,
} from "../../mutations/mailing_lists";

export function UnsubscribeManager({
  preferencesPromise,
  highlightedListNamePromise,
}: {
  preferencesPromise: Promise<
    | {
        ok: true;
        value: {
          client: { id: string; name: string; email: string } | null;
          globalOptIn: boolean;
          subscriptions: Array<{
            listName: string;
            description: string;
            status: "subscribed" | "unsubscribed";
          }>;
        };
      }
    | { ok: false; error: string }
  >;
  highlightedListNamePromise: Promise<string | undefined>;
}) {
  const initialPreferences = use(preferencesPromise);
  const highlightedListName = use(highlightedListNamePromise);

  // Normalize promise result to a safe preferences object
  const prefs = initialPreferences.ok
    ? initialPreferences.value
    : { client: null, globalOptIn: false, subscriptions: [] };

  const [globalOptIn, setGlobalOptIn] = useState(prefs.globalOptIn);
  const [subscriptions, setSubscriptions] = useState(prefs.subscriptions);

  const clientEmail = prefs.client?.email || "";
  const clientId = prefs.client?.id || "";

  // Mutations
  const updateGlobalOptIn = useUpdateGlobalOptInMutation();
  const updateSubscription = useUpdateSubscriptionStatusMutation();

  const handleGlobalToggle = async (checked: boolean) => {
    // Optimistic UI update
    setGlobalOptIn(checked);
    if (!checked) {
      setSubscriptions((prev) =>
        prev.map((s) => ({ ...s, status: "unsubscribed" })),
      );
    } else {
      setSubscriptions((prev) =>
        prev.map((s) => ({ ...s, status: "subscribed" })),
      );
    }

    const result = await updateGlobalOptIn.mutateAsync({
      clientIdOrEmail: clientId || clientEmail,
      optInNewsletter: checked,
    });

    if (!result.ok) {
      // Revert state on failure
      setGlobalOptIn(prefs.globalOptIn);
      setSubscriptions(prefs.subscriptions);
    }
  };

  const handleListToggle = async (
    listName: string,
    currentStatus: "subscribed" | "unsubscribed",
  ) => {
    if (!globalOptIn) return; // Locked if globally opted out

    const nextStatus =
      currentStatus === "subscribed" ? "unsubscribed" : "subscribed";

    // Optimistic UI update
    setSubscriptions((prev) =>
      prev.map((s) =>
        s.listName === listName ? { ...s, status: nextStatus } : s,
      ),
    );

    const result = await updateSubscription.mutateAsync({
      clientIdOrEmail: clientId || clientEmail,
      listName,
      status: nextStatus,
      isPublic: true,
    });

    if (!result.ok) {
      // Revert state on failure
      setSubscriptions(prefs.subscriptions);
    }
  };

  return (
    <div className="flex flex-col gap-6 rounded-3xl border border-zinc-200 bg-white p-6 shadow-xl shadow-zinc-100/50 md:gap-8 md:p-8">
      {/* Profile Header Summary */}
      <div className="flex flex-col gap-2 border-zinc-100 border-b pb-5">
        <span className="font-semibold text-blue-600 text-xs uppercase tracking-wider">
          Subscriber Preferences
        </span>
        <h2 className="font-bold text-xl text-zinc-900 tracking-tight">
          Manage Your Subscriptions
        </h2>
        <div className="mt-1 flex items-center gap-1.5 text-xs text-zinc-500">
          <Mail className="h-3.5 w-3.5 text-zinc-400" />
          <span>Email Address:</span>
          <span className="font-semibold text-zinc-800">{clientEmail}</span>
        </div>
      </div>

      {/* 1. Global Master Switch */}
      <div className="flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-zinc-50/30 p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1.5">
            <span className="flex items-center gap-2 font-bold text-sm text-zinc-900">
              <CheckCircle
                className={`h-4 w-4 ${globalOptIn ? "text-emerald-600" : "text-zinc-400"}`}
              />
              Global Newsletter Subscription
            </span>
            <p className="max-w-sm text-xs text-zinc-500">
              Receive company updates, marketing promotions, and newsletters
              delivered directly.
            </p>
          </div>
          <Checkbox
            checked={globalOptIn}
            onChange={(e) => handleGlobalToggle(e.target.checked)}
            label={globalOptIn ? "Opted In" : "Opted Out"}
            className="shrink-0 cursor-pointer"
          />
        </div>
      </div>

      {/* 2. List-specific Subscriptions */}
      <div className="flex flex-col gap-4">
        <h3 className="flex items-center gap-2 font-bold text-xs text-zinc-500 uppercase tracking-wider">
          <Layers className="h-3.5 w-3.5 text-zinc-400" /> Segmented
          Subscriptions
        </h3>

        {subscriptions.length === 0 ? (
          <div className="rounded-2xl border border-zinc-200 bg-zinc-50/20 py-8 text-center text-xs text-zinc-500">
            No active mailing lists available at this time.
          </div>
        ) : (
          <div
            className={`flex flex-col gap-3 transition-opacity duration-300 ${!globalOptIn ? "opacity-40" : ""}`}
          >
            {subscriptions.map((sub) => {
              const isSubscribed = globalOptIn && sub.status === "subscribed";
              const isHighlighted = sub.listName === highlightedListName;

              return (
                <div
                  key={sub.listName}
                  className={`flex items-center justify-between rounded-xl border p-4 transition-all ${
                    isHighlighted
                      ? "border-blue-200 bg-blue-50/30 shadow-blue-500/5 shadow-sm"
                      : "border-zinc-150 bg-zinc-50/20 hover:border-zinc-200"
                  }`}
                >
                  <div className="flex flex-col gap-1 pr-4">
                    <span className="flex items-center gap-1.5 font-bold text-xs text-zinc-800">
                      {sub.listName}
                      {isHighlighted && (
                        <span className="rounded-full border border-blue-200 bg-blue-100 px-2 py-0.5 font-semibold text-[9px] text-blue-600">
                          Active Link
                        </span>
                      )}
                    </span>
                    {sub.description && (
                      <span className="line-clamp-1 text-[11px] text-zinc-500 leading-normal">
                        {sub.description}
                      </span>
                    )}
                  </div>
                  <Checkbox
                    checked={isSubscribed}
                    onChange={() => handleListToggle(sub.listName, sub.status)}
                    disabled={!globalOptIn}
                    label={isSubscribed ? "Active" : "Paused"}
                    className={`shrink-0 ${globalOptIn ? "cursor-pointer" : "cursor-not-allowed"}`}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Global Opt-Out Informational block */}
      {!globalOptIn && (
        <div className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50/50 p-4 text-[11px] text-zinc-500">
          <BellOff className="h-4 w-4 shrink-0 text-blue-600" />
          <span>You have unsubscribed globally from all campaigns.</span>
        </div>
      )}
    </div>
  );
}
