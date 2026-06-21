import { Send } from "lucide-react";
import type { Campaign } from "../types/types";

export default async function DashboardDispatchLogs({
  campaignsPromise,
  hasSmsPromise,
}: {
  campaignsPromise: Promise<
    { ok: true; value: Campaign[] } | { ok: false; error: string }
  >;
  hasSmsPromise: Promise<boolean>;
}) {
  const [campaignsRes, hasSms] = await Promise.all([
    campaignsPromise,
    hasSmsPromise,
  ]);

  const campaigns = campaignsRes.ok ? campaignsRes.value : [];
  const campaignsToShow = hasSms
    ? campaigns.slice(0, 5)
    : campaigns.filter((c) => c.type === "email").slice(0, 5);

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-6 flex flex-col gap-4 shadow-sm shadow-zinc-100/55">
      <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
        <h2 className="text-md font-bold text-zinc-900 tracking-tight flex items-center gap-2">
          <Send className="w-4 h-4 text-blue-600" /> Recent Dispatch Logs
        </h2>
      </div>

      {campaignsToShow.length === 0 ? (
        <div className="py-12 text-center text-zinc-500 text-sm">
          No dispatches found. Complete a marketing campaign to see your logs.
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
                  {campaign.type === "sms" ? "Text Campaign" : campaign.subject}
                </span>
                <span className="text-xs text-zinc-500">
                  Sent on {new Date(campaign.created_at).toLocaleDateString()}{" "}
                  at {new Date(campaign.created_at).toLocaleTimeString()}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold text-zinc-500 bg-zinc-50 px-3 py-1 rounded-full border border-zinc-150">
                  {campaign.mailing_list_name || "Broadcast to All"}
                </span>
                <span className="text-xs font-semibold uppercase tracking-wider text-zinc-650 bg-zinc-100 px-3 py-1 rounded-full border border-zinc-200">
                  {campaign.type === "both" ? "Email & Text" : campaign.type}
                </span>
                <span className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-full font-bold">
                  {campaign.sent_count} Sent
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
