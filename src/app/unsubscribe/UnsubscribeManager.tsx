"use client";

import { BellOff, CheckCircle, Layers, Mail } from "lucide-react";
import { useState } from "react";
import { Checkbox } from "../../components/ui/checkbox";
import {
  useUpdateGlobalOptInMutation,
  useUpdateSubscriptionStatusMutation,
} from "../../mutations/mailing_lists";

interface UnsubscribeManagerProps {
  initialPreferences: {
    client: { id: string; name: string; email: string } | null;
    globalOptIn: boolean;
    subscriptions: Array<{
      listName: string;
      description: string;
      status: "subscribed" | "unsubscribed";
    }>;
  };
  highlightedListName?: string;
}

export function UnsubscribeManager({
  initialPreferences,
  highlightedListName,
}: UnsubscribeManagerProps) {
  const [globalOptIn, setGlobalOptIn] = useState(
    initialPreferences.globalOptIn,
  );
  const [subscriptions, setSubscriptions] = useState(
    initialPreferences.subscriptions,
  );

  const clientEmail = initialPreferences.client?.email || "";
  const clientId = initialPreferences.client?.id || "";

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
      setGlobalOptIn(initialPreferences.globalOptIn);
      setSubscriptions(initialPreferences.subscriptions);
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
      setSubscriptions(initialPreferences.subscriptions);
    }
  };

  return (
    <div className="bg-zinc-950/40 border border-zinc-800 backdrop-blur-md rounded-3xl p-6 md:p-8 flex flex-col gap-6 md:gap-8 shadow-2xl">
      {/* Profile Header Summary */}
      <div className="flex flex-col gap-2 border-b border-zinc-900 pb-5">
        <span className="text-xs font-semibold uppercase tracking-wider text-violet-400">
          Subscriber Preferences
        </span>
        <h2 className="text-xl font-bold text-white tracking-tight">
          Manage Your Subscriptions
        </h2>
        <div className="flex items-center gap-1.5 mt-1 text-xs text-zinc-400">
          <Mail className="w-3.5 h-3.5 text-zinc-550" />
          <span>Email Address:</span>
          <span className="font-semibold text-zinc-200">{clientEmail}</span>
        </div>
      </div>

      {/* 1. Global Master Switch */}
      <div className="flex flex-col gap-4 p-5 rounded-2xl border border-zinc-850 bg-zinc-900/20">
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-bold text-white flex items-center gap-2">
              <CheckCircle
                className={`w-4 h-4 ${globalOptIn ? "text-emerald-400" : "text-zinc-650"}`}
              />
              Global Newsletter Subscription
            </span>
            <p className="text-xs text-zinc-400 max-w-sm">
              Receive company updates, marketing promotions, and custom
              newsletters delivered securely via AWS SES.
            </p>
          </div>
          <Checkbox
            checked={globalOptIn}
            onChange={(e) => handleGlobalToggle(e.target.checked)}
            label={globalOptIn ? "Opted In" : "Opted Out"}
            className="flex-shrink-0 cursor-pointer"
          />
        </div>
      </div>

      {/* 2. List-specific Subscriptions */}
      <div className="flex flex-col gap-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
          <Layers className="w-3.5 h-3.5 text-zinc-550" /> Segmented
          Subscriptions
        </h3>

        {subscriptions.length === 0 ? (
          <div className="py-8 text-center text-xs text-zinc-500 border border-zinc-900 rounded-2xl bg-zinc-950/20">
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
                  className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                    isHighlighted
                      ? "bg-violet-950/10 border-violet-800/50 shadow-md shadow-violet-500/5"
                      : "bg-zinc-900/40 border-zinc-900 hover:border-zinc-850"
                  }`}
                >
                  <div className="flex flex-col gap-1 pr-4">
                    <span className="text-xs font-bold text-zinc-200 flex items-center gap-1.5">
                      {sub.listName}
                      {isHighlighted && (
                        <span className="px-2 py-0.5 rounded-full bg-violet-600/20 border border-violet-500/40 text-[9px] font-semibold text-violet-400">
                          Active Link
                        </span>
                      )}
                    </span>
                    {sub.description && (
                      <span className="text-[11px] text-zinc-450 line-clamp-1 leading-normal">
                        {sub.description}
                      </span>
                    )}
                  </div>
                  <Checkbox
                    checked={isSubscribed}
                    onChange={() => handleListToggle(sub.listName, sub.status)}
                    disabled={!globalOptIn}
                    label={isSubscribed ? "Active" : "Paused"}
                    className={`flex-shrink-0 ${globalOptIn ? "cursor-pointer" : "cursor-not-allowed"}`}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Global Opt-Out Informational block */}
      {!globalOptIn && (
        <div className="p-4 rounded-xl border border-zinc-900 bg-zinc-950/40 text-[11px] text-zinc-500 flex items-center gap-2">
          <BellOff className="w-4 h-4 text-violet-500/80 flex-shrink-0" />
          <span>
            You have unsubscribed globally from all AWS SES campaigns.
          </span>
        </div>
      )}
    </div>
  );
}
