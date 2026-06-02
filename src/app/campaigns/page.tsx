import { Send } from "lucide-react";
import { CampaignForm } from "../../components/CampaignForm";
import { CampaignList } from "../../components/CampaignList";
import { Navbar } from "../../components/Navbar";
import { dalGetCampaigns } from "../../dal/campaigns";

export const revalidate = 0; // Force dynamic server rendering

export default async function CampaignsPage() {
  // Fetch campaigns from Server DAL directly
  const response = await dalGetCampaigns();
  const campaigns = response.isOk() ? response.value : [];
  const dbError = response.isErr() ? response.error.message : null;

  return (
    <div className="flex flex-col min-h-screen bg-black">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-8 flex flex-col gap-6">
        {/* Title Heading */}
        <div className="flex flex-col gap-2 border-b border-zinc-900 pb-5">
          <div className="flex items-center gap-2">
            <Send className="w-5 h-5 text-violet-500" />
            <h1 className="text-2xl font-extrabold text-white tracking-tight">
              Campaigns & SMS Compositions
            </h1>
          </div>
          <p className="text-sm text-zinc-400">
            Write newsletters and SMS updates, select your channels, and view detailed subscriber delivery receipts.
          </p>
        </div>

        {/* DB Connection Alert Fallback */}
        {dbError && (
          <div className="p-4 rounded-xl border border-yellow-500/20 bg-yellow-950/20 text-yellow-200 text-xs">
            <span className="font-bold block mb-1">⚠️ Local Fallback Active</span>
            Failed to connect to Neon DB: {dbError}. Using simulated campaign databases. Run the DDL script in <code className="text-yellow-400">schema.sql</code> inside your Neon database to fix.
          </div>
        )}

        {/* Layout split grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Form Composer (1/3 width) */}
          <div className="lg:col-span-1">
            <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-400 mb-4">
              Compose Marketing Message
            </h2>
            {/* The page forces dynamic refreshment upon successful mutation dispatch */}
            <CampaignForm />
          </div>

          {/* Campaign List logs (2/3 width) */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-400">
              Dispatch History & Logs
            </h2>
            <CampaignList initialCampaigns={campaigns} />
          </div>
        </div>
      </main>
    </div>
  );
}
