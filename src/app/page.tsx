import { Send, Sparkles, Users } from "lucide-react";
import Link from "next/link";
import { Navbar } from "../components/Navbar";
import { dalGetCampaigns } from "../dal/campaigns";
import { dalGetClients } from "../dal/clients";

export const revalidate = 0; // Force dynamic rendering

export default async function DashboardPage() {
  // Fetch dashboard stats directly from our Data Access Layer on the Server
  const clientsRes = await dalGetClients();
  const campaignsRes = await dalGetCampaigns();

  // Gracefully handle db pending configuration
  const clients = clientsRes.isOk() ? clientsRes.value : [];
  const campaigns = campaignsRes.isOk() ? campaignsRes.value : [];
  const dbError = clientsRes.isErr() ? clientsRes.error.message : null;

  // Compute metrics
  const totalClients = clients.length;
  const emailSubscribers = clients.filter((c) => c.opt_in_newsletter).length;
  const smsSubscribers = clients.filter((c) => c.opt_in_sms).length;

  const emailOptInRate =
    totalClients > 0 ? Math.round((emailSubscribers / totalClients) * 100) : 0;
  const smsOptInRate =
    totalClients > 0 ? Math.round((smsSubscribers / totalClients) * 100) : 0;

  return (
    <div className="flex flex-col min-h-screen bg-black">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-8 flex flex-col gap-8">
        {/* Header Hero Area */}
        <div className="relative rounded-2xl border border-zinc-800 bg-gradient-to-r from-zinc-950 via-zinc-950 to-violet-950/20 p-6 md:p-8 overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-violet-600/10 rounded-full blur-[100px] pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-950/80 border border-violet-800/40 text-violet-400 text-xs font-semibold mb-3 tracking-wide">
                <Sparkles className="w-3.5 h-3.5" /> Next-Gen CMS Portal
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight text-white mb-2 font-display">
                Welcome to ApexCMS Dashboard
              </h1>
              <p className="text-sm text-zinc-400 max-w-lg">
                Manage your client profiles, subscribe channels, and dispatch
                marketing campaigns via AWS SES and Pinpoint.
              </p>
            </div>
            <div className="flex gap-3">
              <Link
                href="/clients"
                className="inline-flex h-11 items-center justify-center rounded-xl bg-zinc-900 border border-zinc-800 px-5 text-sm font-semibold text-zinc-100 hover:bg-zinc-800 transition-colors"
              >
                Manage Clients
              </Link>
              <Link
                href="/campaigns"
                className="inline-flex h-11 items-center justify-center rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white px-5 text-sm font-semibold hover:from-violet-500 hover:to-indigo-500 shadow-md shadow-violet-500/10 transition-all active:scale-98"
              >
                Compose Campaign
              </Link>
            </div>
          </div>
        </div>

        {/* Database Offline Graceful warning */}
        {dbError && (
          <div className="p-5 rounded-2xl border border-yellow-500/20 bg-yellow-950/20 text-yellow-200 text-sm flex flex-col gap-2">
            <span className="font-bold flex items-center gap-2">
              ⚠️ Database Connection Warning (Simulated fallback active)
            </span>
            <p className="text-zinc-400 text-xs leading-relaxed">
              Details: {dbError}. If you haven't executed the database structure
              yet, please copy the DDL script in{" "}
              <code className="text-yellow-400">schema.sql</code> and run it in
              your Neon SQL console, then add your{" "}
              <code className="text-yellow-400">DATABASE_URL</code> connection
              string to your `.env.local` file.
            </p>
          </div>
        )}

        {/* Analytics Grid */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className="p-6 rounded-2xl border border-zinc-800 bg-zinc-950/40 backdrop-blur-md flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                Total Clients
              </span>
              <span className="text-4xl font-extrabold text-white">
                {totalClients}
              </span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-violet-950/60 border border-violet-800/20 flex items-center justify-center text-violet-400">
              <Users className="w-5 h-5" />
            </div>
          </div>

          {/* Card 2 */}
          <div className="p-6 rounded-2xl border border-zinc-800 bg-zinc-950/40 backdrop-blur-md flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-0.5">
                <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Email Subscriptions
                </span>
                <span className="text-2xl font-bold text-white">
                  {emailSubscribers}{" "}
                  <span className="text-xs text-zinc-400">clients</span>
                </span>
              </div>
              <span className="text-sm font-semibold text-emerald-400 bg-emerald-950/65 px-2.5 py-1 rounded-full border border-emerald-800/20">
                {emailOptInRate}%
              </span>
            </div>
            <div className="w-full h-1.5 bg-zinc-900 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-violet-600 to-indigo-600 rounded-full"
                style={{ width: `${emailOptInRate}%` }}
              />
            </div>
          </div>

          {/* Card 3 */}
          <div className="p-6 rounded-2xl border border-zinc-800 bg-zinc-950/40 backdrop-blur-md flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-0.5">
                <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  SMS Subscriptions
                </span>
                <span className="text-2xl font-bold text-white">
                  {smsSubscribers}{" "}
                  <span className="text-xs text-zinc-400">clients</span>
                </span>
              </div>
              <span className="text-sm font-semibold text-sky-400 bg-sky-950/65 px-2.5 py-1 rounded-full border border-sky-800/20">
                {smsOptInRate}%
              </span>
            </div>
            <div className="w-full h-1.5 bg-zinc-900 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-violet-600 to-indigo-600 rounded-full"
                style={{ width: `${smsOptInRate}%` }}
              />
            </div>
          </div>
        </section>

        {/* Recent Dispatch History */}
        <section className="rounded-2xl border border-zinc-800 bg-zinc-950/30 p-6 flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-zinc-900 pb-4">
            <h2 className="text-md font-bold text-white tracking-wide flex items-center gap-2">
              <Send className="w-4 h-4 text-violet-400" /> Recent Dispatch Logs
            </h2>
          </div>

          {campaigns.length === 0 ? (
            <div className="py-12 text-center text-zinc-500 text-sm">
              No dispatches found. Complete a marketing campaign to see your
              logs.
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {campaigns.slice(0, 5).map((campaign) => (
                <div
                  key={campaign.id}
                  className="flex items-center justify-between p-4 rounded-xl border border-zinc-900 bg-zinc-950/60 hover:border-zinc-800 transition-colors"
                >
                  <div className="flex flex-col gap-1">
                    <span className="text-sm font-bold text-zinc-200">
                      {campaign.type === "sms"
                        ? "SMS Campaign"
                        : campaign.subject}
                    </span>
                    <span className="text-xs text-zinc-500">
                      Sent on{" "}
                      {new Date(campaign.created_at).toLocaleDateString()} at{" "}
                      {new Date(campaign.created_at).toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400 bg-zinc-900 px-3 py-1 rounded-full border border-zinc-800">
                      {campaign.type === "both" ? "Email + SMS" : campaign.type}
                    </span>
                    <span className="text-xs text-emerald-400 bg-emerald-950/60 border border-emerald-800/30 px-3 py-1 rounded-full font-bold">
                      {campaign.sent_count} Sent
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
