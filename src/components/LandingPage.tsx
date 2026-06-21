"use client";

import {
  ArrowRight,
  CheckCircle2,
  Layers,
  Mail,
  Phone,
  Send,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export function LandingPage() {
  const [campaignType, setCampaignType] = useState<"email" | "sms">("email");
  const [subject, setSubject] = useState("Exclusive Summer VIP Access ☀️");
  const [body, setBody] = useState(
    "Hi {{name}},\n\nWe are excited to invite you to our VIP Summer Launch! Use code VIP20 at checkout for 20% off all products.\n\nCheers,\n{{company}} Team",
  );
  const [clientName, setClientName] = useState("Sarah");
  const [companyName, setCompanyName] = useState("Acme Pro");

  // Helper to resolve template tags
  const renderPreviewContent = (text: string) => {
    return text
      .replace(/{{name}}/g, clientName || "Valued Customer")
      .replace(/{{company}}/g, companyName || "CMS Pro");
  };

  const features = [
    {
      icon: Users,
      title: "Dynamic Directory",
      description:
        "Manage, segment, and track client profiles. Complete control over subscription channels and opt-in settings.",
    },
    {
      icon: Send,
      title: "Multi-Channel Broadcasts",
      description:
        "Draft email newsletters or text messages in a single premium interface. Reach clients where they engage most.",
    },
    {
      icon: Layers,
      title: "Mailing Lists & Tags",
      description:
        "Organize customers into target mailing lists. Prevent delivery fatigue with automated exclusion tags.",
    },
    {
      icon: ShieldCheck,
      title: "Clerk-Secured Workspace",
      description:
        "Enterprise-grade user identity, session management, and multi-tenant organization switching built-in.",
    },
  ];

  return (
    <div className="relative flex flex-1 flex-col overflow-hidden bg-zinc-50">
      {/* Decorative top-right gradient blob */}
      <div className="absolute top-0 right-0 -z-10 h-[40rem] w-[40rem] translate-x-1/3 -translate-y-1/3 rounded-full bg-blue-100/50 blur-3xl" />
      <div className="absolute top-1/2 left-0 -z-10 h-[30rem] w-[30rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-50/40 blur-3xl" />

      {/* Grid Pattern Background */}
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />

      {/* Hero Header */}
      <section className="mx-auto flex w-full max-w-7xl flex-col items-center gap-6 px-6 pt-16 pb-12 text-center md:pt-24">
        <div className="inline-flex animate-fade-in-scale items-center gap-1.5 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 font-semibold text-blue-600 text-xs tracking-wide">
          <Sparkles className="h-3.5 w-3.5" /> Next-Gen Marketing Campaigns
        </div>
        <h1 className="max-w-4xl font-display font-extrabold text-4xl text-zinc-900 leading-[1.15] tracking-tight sm:text-5xl md:text-6xl">
          Grow your audience. <br className="hidden sm:inline" />
          Dispatch campaigns that{" "}
          <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            convert.
          </span>
        </h1>
        <p className="max-w-2xl text-base text-zinc-500 leading-relaxed sm:text-lg">
          CMS Pro brings CRM client segmentation, automated mailing lists, and
          multi-channel campaign delivery (Email & SMS) under one beautiful
          interface.
        </p>
        <div className="mt-2 flex flex-col items-center gap-4 sm:flex-row">
          <Link
            href="/sign-up"
            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-8 font-semibold text-sm text-white shadow-blue-600/15 shadow-lg transition-all hover:bg-blue-700 hover:shadow-blue-600/25 active:scale-98 sm:w-auto"
          >
            Start Free Account <ArrowRight className="h-4 w-4" />
          </Link>
          <a
            href="#demo"
            className="inline-flex h-12 w-full items-center justify-center rounded-xl border border-zinc-200 bg-white px-8 font-semibold text-sm text-zinc-700 transition-all hover:bg-zinc-50 active:scale-98 sm:w-auto"
          >
            Try Live Sandbox
          </a>
        </div>
      </section>

      {/* Interactive Sandbox Section */}
      <section
        id="demo"
        className="mx-auto w-full max-w-6xl scroll-mt-20 px-6 py-12"
      >
        <div className="grid grid-cols-1 overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-xl lg:grid-cols-12">
          {/* Controls Panel */}
          <div className="flex flex-col gap-6 border-zinc-150 border-r p-6 md:p-8 lg:col-span-5">
            <div>
              <h3 className="mb-1 font-bold text-lg text-zinc-900">
                Interactive Sandbox
              </h3>
              <p className="text-xs text-zinc-550">
                Compose a draft campaign below and see how dynamic tags resolve
                in real-time.
              </p>
            </div>

            {/* Selector */}
            <div className="flex rounded-xl border border-zinc-200 bg-zinc-100 p-1">
              <button
                type="button"
                onClick={() => setCampaignType("email")}
                className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2 font-bold text-xs transition-all ${
                  campaignType === "email"
                    ? "border border-zinc-200/50 bg-white text-blue-600 shadow-sm"
                    : "text-zinc-500 hover:text-zinc-800"
                }`}
              >
                <Mail className="h-3.5 w-3.5" /> Email
              </button>
              <button
                type="button"
                onClick={() => setCampaignType("sms")}
                className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2 font-bold text-xs transition-all ${
                  campaignType === "sms"
                    ? "border border-zinc-200/50 bg-white text-blue-600 shadow-sm"
                    : "text-zinc-500 hover:text-zinc-800"
                }`}
              >
                <Phone className="h-3.5 w-3.5" /> SMS Text
              </button>
            </div>

            {/* Variables config */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="recipient-name"
                  className="mb-1 block font-bold text-[10px] text-zinc-500 uppercase tracking-wider"
                >
                  Recipient Name ({"{{name}}"})
                </label>
                <input
                  id="recipient-name"
                  type="text"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-xs focus:border-blue-500 focus:outline-none"
                  placeholder="e.g. Sarah"
                />
              </div>
              <div>
                <label
                  htmlFor="company-name"
                  className="mb-1 block font-bold text-[10px] text-zinc-500 uppercase tracking-wider"
                >
                  Company Name ({"{{company}}"})
                </label>
                <input
                  id="company-name"
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-xs focus:border-blue-500 focus:outline-none"
                  placeholder="e.g. Acme Pro"
                />
              </div>
            </div>

            {/* Email Subject field */}
            {campaignType === "email" && (
              <div>
                <label
                  htmlFor="subject-line"
                  className="mb-1 block font-bold text-[10px] text-zinc-500 uppercase tracking-wider"
                >
                  Subject Line
                </label>
                <input
                  id="subject-line"
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-xs focus:border-blue-500 focus:outline-none"
                />
              </div>
            )}

            {/* Campaign Body */}
            <div className="flex flex-1 flex-col">
              <label
                htmlFor="campaign-body"
                className="mb-1 block font-bold text-[10px] text-zinc-500 uppercase tracking-wider"
              >
                Campaign Message Body
              </label>
              <textarea
                id="campaign-body"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={5}
                className="w-full flex-1 resize-none rounded-lg border border-zinc-200 p-3 font-mono text-xs leading-relaxed focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Visual Preview Device */}
          <div className="flex items-center justify-center border-zinc-150 border-t bg-zinc-50/50 p-6 md:p-8 lg:col-span-7 lg:border-t-0 lg:border-l">
            {campaignType === "email" ? (
              // Email Client Mockup
              <div className="flex w-full max-w-lg animate-slide-in flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-md">
                {/* Email Client Header */}
                <div className="flex flex-col gap-1.5 border-zinc-200 border-b bg-zinc-100/60 px-4 py-3 text-xs">
                  <div className="flex items-center gap-1.5 text-zinc-400">
                    <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
                    <span className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
                    <span className="h-2.5 w-2.5 rounded-full bg-green-400" />
                    <span className="ml-2 font-medium text-[10px] text-zinc-500">
                      New Message - Preview Mode
                    </span>
                  </div>
                  <div className="mt-1 grid grid-cols-[60px_1fr] items-center text-zinc-500">
                    <span className="font-semibold">From:</span>
                    <span className="font-medium text-zinc-800">
                      campaigns@mg.
                      {companyName.toLowerCase().replace(/\s+/g, "") ||
                        "cmspro"}
                      .com
                    </span>
                  </div>
                  <div className="grid grid-cols-[60px_1fr] items-center text-zinc-500">
                    <span className="font-semibold">To:</span>
                    <span className="font-medium text-zinc-800">
                      {clientName.toLowerCase() || "customer"}@example.com
                    </span>
                  </div>
                  <div className="grid grid-cols-[60px_1fr] items-center text-zinc-500">
                    <span className="font-semibold">Subject:</span>
                    <span className="font-bold text-blue-600">
                      {subject || "(No Subject)"}
                    </span>
                  </div>
                </div>
                {/* Email Content Body */}
                <div className="min-h-[180px] whitespace-pre-wrap p-6 text-sm text-zinc-800 leading-relaxed">
                  {renderPreviewContent(body)}
                </div>
                {/* Email Footer */}
                <div className="border-zinc-100 border-t bg-zinc-50 px-6 py-4 text-center">
                  <span className="font-medium text-[10px] text-zinc-400">
                    Powered by CMS Pro. Click here to{" "}
                    <span className="cursor-pointer text-blue-600 underline">
                      unsubscribe
                    </span>
                    .
                  </span>
                </div>
              </div>
            ) : (
              // SMS iPhone Mockup
              <div className="relative flex h-[520px] w-[280px] animate-slide-in flex-col overflow-hidden rounded-[36px] border-[8px] border-zinc-800 bg-black shadow-lg">
                {/* Dynamic Island */}
                <div className="absolute top-2 left-1/2 z-20 flex h-4 w-24 -translate-x-1/2 items-center justify-center rounded-full bg-zinc-800" />

                {/* iPhone Screen Header */}
                <div className="relative flex flex-col items-center gap-1 border-zinc-800 border-b bg-zinc-900 px-4 pt-8 pb-3 text-white">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-800 font-bold text-[10px] text-zinc-300">
                    {clientName.slice(0, 2).toUpperCase() || "CU"}
                  </div>
                  <span className="font-semibold text-[10px] text-zinc-100 tracking-wide">
                    {clientName || "Customer"}
                  </span>
                  <span className="text-[8px] text-zinc-500">iMessage</span>
                </div>

                {/* iPhone Messages Thread */}
                <div className="flex flex-1 flex-col justify-end gap-2 overflow-y-auto bg-zinc-950 p-3">
                  <div className="my-2 text-center font-medium text-[8px] text-zinc-650">
                    Today 10:42 AM
                  </div>

                  {/* SMS Bubble */}
                  <div className="relative max-w-[85%] self-end rounded-2xl rounded-br-none bg-blue-600 px-3 py-2 text-white text-xs leading-relaxed shadow-sm">
                    <p className="whitespace-pre-wrap">
                      {renderPreviewContent(body)}
                    </p>
                  </div>
                  <div className="mr-1 self-end text-[7px] text-zinc-500">
                    Delivered
                  </div>
                </div>

                {/* iPhone Screen Footer Bar */}
                <div className="flex items-center gap-2 border-zinc-800 border-t bg-zinc-900 px-3 py-2.5">
                  <div className="flex-1 rounded-full border border-zinc-850 bg-zinc-950 px-3 py-1 text-[9px] text-zinc-500">
                    Text Message
                  </div>
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-[9px] text-white">
                    ▲
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section
        id="features"
        className="mx-auto grid w-full max-w-7xl scroll-mt-20 grid-cols-1 gap-8 px-6 py-16 md:grid-cols-2 lg:grid-cols-4"
      >
        {features.map((feat) => {
          const Icon = feat.icon;
          return (
            <div
              key={feat.title}
              className="group flex flex-col gap-4 rounded-2xl border border-zinc-200/70 bg-white p-6 shadow-sm transition-all hover:border-zinc-300 hover:shadow-md"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 text-blue-600 transition-transform group-hover:scale-110">
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <h4 className="mb-1 font-bold text-sm text-zinc-900">
                  {feat.title}
                </h4>
                <p className="text-xs text-zinc-500 leading-relaxed">
                  {feat.description}
                </p>
              </div>
            </div>
          );
        })}
      </section>

      {/* Benefits Showcase */}
      <section
        id="benefits"
        className="scroll-mt-20 border-zinc-200 border-y bg-white py-16"
      >
        <div className="mx-auto grid w-full max-w-6xl grid-cols-1 items-center gap-12 px-6 md:grid-cols-2">
          <div className="flex flex-col gap-6">
            <div className="inline-flex w-fit items-center gap-1 rounded-full border border-blue-100 bg-blue-50 px-2.5 py-0.5 font-bold text-[10px] text-blue-600 uppercase tracking-wider">
              High Delivery Engine
            </div>
            <h2 className="font-display font-extrabold text-3xl text-zinc-900 tracking-tight">
              Reach 100% of your subscribed audience
            </h2>
            <p className="text-sm text-zinc-550 leading-relaxed">
              SMS messages are opened on average 98% of the time, while email
              lists ensure your detailed monthly newsletters find a permanent
              home. With CMS Pro, combine both formats in one platform to
              capture ultimate engagement.
            </p>
            <div className="flex flex-col gap-3.5">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
                <span className="font-semibold text-xs text-zinc-800">
                  Dynamic tag personalization resolving instantly
                </span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
                <span className="font-semibold text-xs text-zinc-800">
                  Smart opt-in filters for spam compliance
                </span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
                <span className="font-semibold text-xs text-zinc-800">
                  Direct integration with Neon DB serverless workflows
                </span>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-6 rounded-2xl border border-zinc-200/80 bg-zinc-50 p-6 shadow-inner md:p-8">
            <h4 className="font-bold text-xs text-zinc-400 uppercase tracking-widest">
              Campaign Metrics Overview
            </h4>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1 rounded-xl border border-zinc-200/60 bg-white p-4 shadow-sm">
                <span className="font-bold text-[10px] text-zinc-400 uppercase tracking-wider">
                  SMS Open Rate
                </span>
                <span className="font-black font-display text-3xl text-blue-600">
                  98.2%
                </span>
                <span className="text-[9px] text-zinc-500">
                  Industry-leading speed
                </span>
              </div>
              <div className="flex flex-col gap-1 rounded-xl border border-zinc-200/60 bg-white p-4 shadow-sm">
                <span className="font-bold text-[10px] text-zinc-400 uppercase tracking-wider">
                  Email Delivery
                </span>
                <span className="font-black font-display text-3xl text-emerald-600">
                  99.9%
                </span>
                <span className="text-[9px] text-zinc-500">
                  AWS SES architecture
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-zinc-200/60 bg-white p-4 shadow-sm">
              <div className="flex flex-col gap-1">
                <span className="font-bold text-[10px] text-zinc-400 uppercase tracking-wider">
                  Total Active Subscribers
                </span>
                <span className="font-bold text-xl text-zinc-800">
                  1,842 clients
                </span>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full border border-zinc-100 bg-zinc-50 text-zinc-650">
                <Users className="h-4 w-4" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Security & Stack */}
      <section
        id="security"
        className="mx-auto flex w-full max-w-5xl scroll-mt-20 flex-col items-center gap-10 px-6 py-16 text-center"
      >
        <div className="flex flex-col gap-3">
          <h3 className="font-bold text-2xl text-zinc-900 tracking-tight">
            Built with modern, secure technology
          </h3>
          <p className="max-w-lg text-xs text-zinc-500 leading-relaxed">
            Your data is stored securely and dispatched using production-ready
            cloud services.
          </p>
        </div>

        <div className="grid w-full grid-cols-1 gap-6 sm:grid-cols-3">
          <div className="flex flex-col items-center gap-3 rounded-xl border border-zinc-200/60 bg-white p-5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-100 bg-zinc-50 font-bold text-xs text-zinc-700">
              🔒 Clerk
            </div>
            <div>
              <h5 className="mb-0.5 font-bold text-xs text-zinc-900">
                Secure Authentication
              </h5>
              <p className="text-[10px] text-zinc-550">
                Clerk protects all user directories & credentials.
              </p>
            </div>
          </div>
          <div className="flex flex-col items-center gap-3 rounded-xl border border-zinc-200/60 bg-white p-5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-100 bg-zinc-50 font-bold text-xs text-zinc-700">
              ⚡ Neon
            </div>
            <div>
              <h5 className="mb-0.5 font-bold text-xs text-zinc-900">
                Neon Serverless DB
              </h5>
              <p className="text-[10px] text-zinc-550">
                Direct connection pooling for blazing SQL speed.
              </p>
            </div>
          </div>
          <div className="flex flex-col items-center gap-3 rounded-xl border border-zinc-200/60 bg-white p-5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-100 bg-zinc-50 font-bold text-xs text-zinc-700">
              ☁️ AWS
            </div>
            <div>
              <h5 className="mb-0.5 font-bold text-xs text-zinc-900">
                AWS SES & Pinpoint
              </h5>
              <p className="text-[10px] text-zinc-550">
                Global high-capacity mailing and text routing.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Box */}
      <section className="mx-auto mt-4 w-full max-w-5xl px-6 pb-20">
        <div className="relative flex flex-col items-center gap-5 overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 p-8 text-center shadow-blue-600/10 shadow-lg md:p-12">
          <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,#ffffff0a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0a_1px,transparent_1px)] bg-[size:16px_16px]" />
          <h2 className="font-display font-extrabold text-2xl text-white tracking-tight md:text-3xl">
            Ready to scale your reach?
          </h2>
          <p className="max-w-md text-blue-100 text-xs leading-relaxed md:text-sm">
            Create an organization, import your contacts list, and draft your
            first dispatch campaign in minutes.
          </p>
          <Link
            href="/sign-up"
            className="mt-2 inline-flex h-11 items-center justify-center rounded-xl bg-white px-8 font-bold text-blue-600 text-xs shadow-md transition-all hover:bg-zinc-50 active:scale-98"
          >
            Create Your Account
          </Link>
        </div>
      </section>
    </div>
  );
}

export default LandingPage;
