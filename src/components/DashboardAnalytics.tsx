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
      <div className="flex items-center justify-between rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm shadow-zinc-100/55">
        <div className="flex flex-col gap-1">
          <span className="font-semibold text-xs text-zinc-500 uppercase tracking-wider">
            Total Clients
          </span>
          <span className="font-extrabold text-4xl text-zinc-900">
            {totalClients}
          </span>
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 text-blue-600">
          <Users className="h-5 w-5" />
        </div>
      </div>

      <div className="flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm shadow-zinc-100/55">
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-0.5">
            <span className="font-semibold text-xs text-zinc-500 uppercase tracking-wider">
              Email Subscriptions
            </span>
            <span className="font-bold text-2xl text-zinc-900">
              {emailSubscribers}{" "}
              <span className="font-medium text-xs text-zinc-500">clients</span>
            </span>
          </div>
          <span className="rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-1 font-semibold text-emerald-700 text-sm">
            {emailOptInRate}%
          </span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-100">
          <div
            className="h-full rounded-full bg-blue-600"
            style={{ width: `${emailOptInRate}%` }}
          />
        </div>
      </div>

      {hasSms && (
        <div className="flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm shadow-zinc-100/55">
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-0.5">
              <span className="font-semibold text-xs text-zinc-500 uppercase tracking-wider">
                Text Subscriptions
              </span>
              <span className="font-bold text-2xl text-zinc-900">
                {smsSubscribers}{" "}
                <span className="font-medium text-xs text-zinc-500">
                  clients
                </span>
              </span>
            </div>
            <span className="rounded-full border border-blue-100 bg-blue-50 px-2.5 py-1 font-semibold text-blue-700 text-sm">
              {smsOptInRate}%
            </span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-100">
            <div
              className="h-full rounded-full bg-blue-600"
              style={{ width: `${smsOptInRate}%` }}
            />
          </div>
        </div>
      )}
    </section>
  );
}
