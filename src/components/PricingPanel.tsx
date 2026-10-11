"use client";

import { OrganizationSwitcher, PricingTable, useAuth } from "@clerk/nextjs";
import Link from "next/link";
import { ACCESS_FEATURE } from "@/utils/plan";

export function PricingPanel() {
  const { isLoaded, userId, orgId, has } = useAuth();

  if (!isLoaded) {
    return <div className="h-64 animate-pulse rounded-2xl bg-zinc-100" />;
  }

  if (!userId) {
    return (
      <div className="flex flex-col items-center gap-3 text-center">
        <p className="text-sm text-zinc-600">
          Sign up to create your organization and pick a plan.
        </p>
        <Link
          href="/sign-up"
          className="rounded-xl bg-blue-600 px-4 py-2 font-semibold text-sm text-white hover:bg-blue-700"
        >
          Get Started
        </Link>
      </div>
    );
  }

  if (!orgId) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-zinc-200 bg-zinc-50 p-6 text-center">
        <p className="text-sm text-zinc-600">
          Plans belong to an organization. Create or select one first.
        </p>
        <OrganizationSwitcher
          hidePersonal
          afterCreateOrganizationUrl="/pricing"
          afterSelectOrganizationUrl="/pricing"
        />
      </div>
    );
  }

  const hasAccess = has?.({ feature: ACCESS_FEATURE }) ?? false;

  return (
    <div className="flex flex-col gap-4">
      {hasAccess ? (
        <div className="flex items-center justify-between rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-800 text-sm">
          <span>Your organization has an active plan.</span>
          <Link href="/" className="font-semibold underline">
            Go to dashboard
          </Link>
        </div>
      ) : null}
      <PricingTable for="organization" newSubscriptionRedirectUrl="/" />
    </div>
  );
}
