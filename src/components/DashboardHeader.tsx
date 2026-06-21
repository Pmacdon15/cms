import { Sparkles } from "lucide-react";
import Link from "next/link";

export default function DashboardHeader() {
  return (
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
  );
}
