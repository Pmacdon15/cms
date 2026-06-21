import { auth } from "@clerk/nextjs/server";
import { Suspense } from "react";
import AnalyticsSkeleton from "../components/AnalyticsSkeleton";
import DashboardAnalytics from "../components/DashboardAnalytics";
import DashboardDispatchLogs from "../components/DashboardDispatchLogs";
import DashboardHeader from "../components/DashboardHeader";
import DispatchLogsSkeleton from "../components/DispatchLogsSkeleton";
import { dalGetCampaigns } from "../dal/campaigns";
import { dalGetClients } from "../dal/clients";

export default function DashboardPage() {
  const clientsPromise = dalGetClients();
  const campaignsPromise = dalGetCampaigns();
  const hasSmsPromise = auth
    .protect()
    .then((auth) => auth.has({ feature: "send_sms" }));

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-8 p-6 md:p-8">
      <DashboardHeader />

      <Suspense fallback={<AnalyticsSkeleton />}>
        <DashboardAnalytics
          clientsPromise={clientsPromise}
          hasSmsPromise={hasSmsPromise}
        />
      </Suspense>

      <Suspense fallback={<DispatchLogsSkeleton />}>
        <DashboardDispatchLogs
          campaignsPromise={campaignsPromise}
          hasSmsPromise={hasSmsPromise}
        />
      </Suspense>
    </main>
  );
}
