import Link from "next/link";

export default function DashboardHeader() {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm shadow-zinc-100/50 md:p-8">
      <div className="relative z-10 flex flex-col justify-between gap-6 md:flex-row md:items-center">
        <div>
          <h1 className="mb-2 font-display font-extrabold text-3xl text-zinc-900 tracking-tight">
            Welcome to CMS Pro Dashboard
          </h1>
          <p className="max-w-lg text-sm text-zinc-500">
            Manage your client profiles, subscribe channels, and dispatch
            marketing campaigns.
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/clients"
            className="inline-flex h-11 items-center justify-center rounded-xl border border-zinc-200 bg-zinc-100 px-5 font-semibold text-sm text-zinc-800 transition-colors hover:bg-zinc-200/80"
          >
            Manage Clients
          </Link>
          <Link
            href="/campaigns"
            className="inline-flex h-11 items-center justify-center rounded-xl bg-blue-600 px-5 font-semibold text-sm text-white shadow-sm transition-all hover:bg-blue-700 active:scale-98"
          >
            Compose Campaign
          </Link>
        </div>
      </div>
    </div>
  );
}
