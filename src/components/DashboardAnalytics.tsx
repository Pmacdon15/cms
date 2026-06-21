import { Users } from "lucide-react";
import type { Client } from "../types/types";

export default async function DashboardAnalytics({
  clientsPromise,
  hasSmsPromise,
}: {
  clientsPromise: Promise<
    { ok: true; value: Client[] } | { ok: false; error: string }
  >;
  hasSmsPromise: Promise<boolean>;
}) {
  const [clientsRes, hasSms] = await Promise.all([
    clientsPromise,
    hasSmsPromise,
  ]);

  const clients = clientsRes.ok ? clientsRes.value : [];
  const totalClients = clients.length;
  const emailSubscribers = clients.filter((c) => c.opt_in_newsletter).length;
  const smsSubscribers = clients.filter((c) => c.opt_in_sms).length;

  const emailOptInRate =
    totalClients > 0 ? Math.round((emailSubscribers / totalClients) * 100) : 0;
  const smsOptInRate =
    totalClients > 0 ? Math.round((smsSubscribers / totalClients) * 100) : 0;

  return (
    <section
      className={`grid grid-cols-1 gap-6 ${
        hasSms ? "md:grid-cols-3" : "md:grid-cols-2"
      }`}
    >
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

      <div className="p-6 rounded-2xl border border-zinc-200 bg-white flex flex-col gap-4 shadow-sm shadow-zinc-100/55">
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-0.5">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Email Subscriptions
            </span>
            <span className="text-2xl font-bold text-zinc-900">
              {emailSubscribers}{" "}
              <span className="text-xs text-zinc-500 font-medium">clients</span>
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
  );
}
