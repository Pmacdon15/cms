import { auth } from "@clerk/nextjs/server";
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

  // Compute metrics
  const totalClients = clients.length;
  const emailSubscribers = clients.filter((c) => c.opt_in_newsletter).length;
  const smsSubscribers = clients.filter((c) => c.opt_in_sms).length;

  const emailOptInRate =
    totalClients > 0 ? Math.round((emailSubscribers / totalClients) * 100) : 0;
  const smsOptInRate =
    totalClients > 0 ? Math.round((smsSubscribers / totalClients) * 100) : 0;

  // Filter dispatch logs based on SMS feature
  const campaignsToShow = hasSms
    ? campaigns.slice(0, 5)
    : campaigns.filter((c) => c.type === "email").slice(0, 5);

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-8 flex flex-col gap-8">
        {/* Header Hero Area */}
        <div className="relative rounded-2xl border border-zinc-200 bg-white p-6 md:p-8 overflow-hidden shadow-sm shadow-zinc-100/50">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-600 text-xs font-semibold mb-3 tracking-wide">
                <Sparkles className="w-3.5 h-3.5" /> Next-Gen CMS Portal
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 mb-2 font-display">
                Welcome to CMS Pro Dashboard
              </h1>
              <p className="text-sm text-zinc-500 max-w-lg">
                Manage your client profiles, subscribe channels, and dispatch
                marketing campaigns.
              </p>
            </div>
            <div className="flex gap-3">
              <Link
                href="/clients"
                className="inline-flex h-11 items-center justify-center rounded-xl bg-zinc-100 border border-zinc-200 px-5 text-sm font-semibold text-zinc-800 hover:bg-zinc-200/80 transition-colors"
              >
                Manage Clients
              </Link>
              <Link
                href="/campaigns"
                className="inline-flex h-11 items-center justify-center rounded-xl bg-blue-600 text-white px-5 text-sm font-semibold hover:bg-blue-700 shadow-sm active:scale-98 transition-all"
              >
                Compose Campaign
              </Link>
            </div>
          </div>
        </div>

        {/* Database Offline Graceful warning */}
        {dbError && (
          <div className="p-5 rounded-2xl border border-yellow-250 bg-yellow-50/70 text-yellow-900 text-sm flex flex-col gap-2">
            <span className="font-bold flex items-center gap-2">
              ⚠️ Database Connection Warning (Simulated fallback active)
            </span>
            <p className="text-zinc-600 text-xs leading-relaxed">
              Details: {dbError}. If you haven't executed the database structure
              yet, please copy the DDL script in{" "}
              <code className="text-yellow-850 bg-yellow-100/50 px-1 py-0.5 rounded">
                schema.sql
              </code>{" "}
              and run it in your Neon SQL console, then add your{" "}
              <code className="text-yellow-850 bg-yellow-100/50 px-1 py-0.5 rounded">
                DATABASE_URL
              </code>{" "}
              connection string to your `.env.local` file.
            </p>
          </div>
        )}

        {/* Analytics Grid */}
        <section
          className={`grid grid-cols-1 gap-6 ${
            hasSms ? "md:grid-cols-3" : "md:grid-cols-2"
          }`}
        >
          {/* Card 1 */}
          <div className="p-6 rounded-2xl border border-zinc-200 bg-white flex items-center justify-between shadow-sm shadow-zinc-100/55">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                Total Clients
              </span>
              <span className="text-4xl font-extrabold text-zinc-900">
                {totalClients}
              </span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
              <Users className="w-5 h-5" />
            </div>
          </div>

          {/* Card 2 */}
          <div className="p-6 rounded-2xl border border-zinc-200 bg-white flex flex-col gap-4 shadow-sm shadow-zinc-100/55">
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-0.5">
                <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Email Subscriptions
                </span>
                <span className="text-2xl font-bold text-zinc-900">
                  {emailSubscribers}{" "}
                  <span className="text-xs text-zinc-500 font-medium">
                    clients
                  </span>
                </span>
              </div>
              <span className="text-sm font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
                {emailOptInRate}%
              </span>
            </div>
            <div className="w-full h-1.5 bg-zinc-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 rounded-full"
                style={{ width: `${emailOptInRate}%` }}
              />
            </div>
          </div>

          {/* Card 3 (SMS Subscriptions) */}
          {hasSms && (
            <div className="p-6 rounded-2xl border border-zinc-200 bg-white flex flex-col gap-4 shadow-sm shadow-zinc-100/55">
              <div className="flex items-center justify-between">
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                    Text Subscriptions
                  </span>
                  <span className="text-2xl font-bold text-zinc-900">
                    {smsSubscribers}{" "}
                    <span className="text-xs text-zinc-500 font-medium">
                      clients
                    </span>
                  </span>
                </div>
                <span className="text-sm font-semibold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100">
                  {smsOptInRate}%
                </span>
              </div>
              <div className="w-full h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 rounded-full"
                  style={{ width: `${smsOptInRate}%` }}
                />
              </div>
            </div>
          )}
        </section>

        {/* Recent Dispatch History */}
        <section className="rounded-2xl border border-zinc-200 bg-white p-6 flex flex-col gap-4 shadow-sm shadow-zinc-100/55">
          <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
            <h2 className="text-md font-bold text-zinc-900 tracking-tight flex items-center gap-2">
              <Send className="w-4 h-4 text-blue-600" /> Recent Dispatch Logs
            </h2>
          </div>

          {campaignsToShow.length === 0 ? (
            <div className="py-12 text-center text-zinc-500 text-sm">
              No dispatches found. Complete a marketing campaign to see your
              logs.
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {campaignsToShow.map((campaign) => (
                <div
                  key={campaign.id}
                  className="flex items-center justify-between p-4 rounded-xl border border-zinc-100 bg-zinc-50/20 hover:border-zinc-200 transition-colors"
                >
                  <div className="flex flex-col gap-1">
                    <span className="text-sm font-bold text-zinc-800">
                      {campaign.type === "sms"
                        ? "Text Campaign"
                        : campaign.subject}
                    </span>
                    <span className="text-xs text-zinc-500">
                      Sent on{" "}
                      {new Date(campaign.created_at).toLocaleDateString()} at{" "}
                      {new Date(campaign.created_at).toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-semibold text-zinc-500 bg-zinc-50 px-3 py-1 rounded-full border border-zinc-150">
                      {campaign.mailing_list_name || "Broadcast to All"}
                    </span>
                    <span className="text-xs font-semibold uppercase tracking-wider text-zinc-600 bg-zinc-100 px-3 py-1 rounded-full border border-zinc-200">
                      {campaign.type === "both" ? "Email & Text" : campaign.type}
                    </span>
                    <span className="text-xs text-emerald-750 bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-full font-bold">
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
