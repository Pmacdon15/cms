import { auth } from "@clerk/nextjs/server";
import { Send } from "lucide-react";
import { CampaignForm } from "../../components/CampaignForm";
import { CampaignList } from "../../components/CampaignList";
import { Navbar } from "../../components/Navbar";
import { dalGetCampaigns } from "../../dal/campaigns";
import { dalGetMailingLists } from "../../dal/mailing_lists";

export const revalidate = 0; // Force dynamic server rendering

export default async function CampaignsPage() {
  // Fetch campaigns and mailing lists from Server DAL directly
  const response = await dalGetCampaigns();
  const campaigns = response.isOk() ? response.value : [];
  const dbError = response.isErr() ? response.error.message : null;

  const listsRes = await dalGetMailingLists();
  const mailingLists = listsRes.isOk() ? listsRes.value : [];

  // Check for SMS feature gate
  const hasClerkKeys = !!(
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
    process.env.CLERK_SECRET_KEY
  );
  const clerkAuth = await auth();
  const hasSms =
    !hasClerkKeys ||
    (clerkAuth.has
      ? clerkAuth.has({ permission: "send_sms" })
      : false);

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-8 flex flex-col gap-6">
        {/* Title Heading */}
        <div className="flex flex-col gap-2 border-b border-zinc-100 pb-5">
          <div className="flex items-center gap-2">
            <Send className="w-5 h-5 text-blue-605" />
            <h1 className="text-2xl font-extrabold text-zinc-900 tracking-tight">
              {hasSms ? "Campaigns & SMS Compositions" : "Campaigns"}
            </h1>
          </div>
          <p className="text-sm text-zinc-500">
            {hasSms
              ? "Write newsletters and SMS updates, select your channels, and view detailed subscriber delivery receipts."
              : "Write newsletters, select your target lists, and view detailed subscriber delivery receipts."}
          </p>
        </div>

        {/* DB Connection Alert Fallback */}
        {dbError && (
          <div className="p-4 rounded-xl border border-yellow-250 bg-yellow-50/70 text-yellow-900 text-xs">
            <span className="font-bold block mb-1">
              ⚠️ Local Fallback Active
            </span>
            Failed to connect to Neon DB: {dbError}. Using simulated campaign
            databases. Run the DDL script in{" "}
            <code className="text-yellow-850 bg-yellow-100/55 px-1 py-0.5 rounded">
              schema.sql
            </code>{" "}
            inside your Neon database to fix.
          </div>
        )}

        {/* Layout split grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Form Composer (1/3 width) */}
          <div className="lg:col-span-1">
            <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-500 mb-4">
              Compose Marketing Message
            </h2>
            {/* The page forces dynamic refreshment upon successful mutation dispatch */}
            <CampaignForm mailingLists={mailingLists} hasSms={hasSms} />
          </div>

          {/* Campaign List logs (2/3 width) */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-500">
              Dispatch History & Logs
            </h2>
            <CampaignList initialCampaigns={campaigns} hasSms={hasSms} />
          </div>
        </div>
      </main>
    </div>
  );
}
