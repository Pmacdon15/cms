import type { Metadata } from "next";
import { PricingPanel } from "@/components/PricingPanel";

export const metadata: Metadata = {
  title: "Pricing - CMS Pro",
  description: "Choose a plan for your organization.",
};

export default function PricingPage() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 p-6 md:p-8">
      <div className="flex flex-col gap-2 border-zinc-100 border-b pb-5 text-center">
        <h1 className="font-extrabold text-3xl text-zinc-900 tracking-tight">
          Plans & Pricing
        </h1>
        <p className="text-sm text-zinc-500">
          Every organization needs a plan to use CMS Pro. Start free, upgrade
          any time.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <PlanSummary
          name="Free"
          items={[
            "1 mailing list",
            "50 clients",
            "50 mailing list sends / month",
            "1 user",
          ]}
        />
        <PlanSummary
          name="Pro"
          items={[
            "10 mailing lists",
            "100 clients",
            "100 mailing list sends / month",
            "1 user included, up to 3 ($3/month per extra user)",
          ]}
        />
      </div>

      <PricingPanel />
    </main>
  );
}

function PlanSummary({ name, items }: { name: string; items: string[] }) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
      <h2 className="mb-3 font-bold text-lg text-zinc-900">{name}</h2>
      <ul className="flex flex-col gap-1.5 text-sm text-zinc-600">
        {items.map((item) => (
          <li key={item}>• {item}</li>
        ))}
      </ul>
    </div>
  );
}
