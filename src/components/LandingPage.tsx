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
    <div className="flex-1 bg-zinc-50 relative overflow-hidden flex flex-col">
      {/* Decorative top-right gradient blob */}
      <div className="absolute top-0 right-0 w-[40rem] h-[40rem] rounded-full bg-blue-100/50 blur-3xl -z-10 translate-x-1/3 -translate-y-1/3" />
      <div className="absolute top-1/2 left-0 w-[30rem] h-[30rem] rounded-full bg-indigo-50/40 blur-3xl -z-10 -translate-x-1/2 -translate-y-1/2" />

      {/* Grid Pattern Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] -z-10" />

      {/* Hero Header */}
      <section className="max-w-7xl w-full mx-auto px-6 pt-16 md:pt-24 pb-12 flex flex-col items-center text-center gap-6">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-600 text-xs font-semibold tracking-wide animate-fade-in-scale">
          <Sparkles className="w-3.5 h-3.5" /> Next-Gen Marketing Campaigns
        </div>
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-zinc-900 max-w-4xl font-display leading-[1.15]">
          Grow your audience. <br className="hidden sm:inline" />
          Dispatch campaigns that{" "}
          <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            convert.
          </span>
        </h1>
        <p className="text-base sm:text-lg text-zinc-500 max-w-2xl leading-relaxed">
          CMS Pro brings CRM client segmentation, automated mailing lists, and
          multi-channel campaign delivery (Email & SMS) under one beautiful
          interface.
        </p>
        <div className="flex flex-col sm:flex-row items-center gap-4 mt-2">
          <Link
            href="/sign-up"
            className="w-full sm:w-auto inline-flex h-12 items-center justify-center rounded-xl bg-blue-600 text-white px-8 text-sm font-semibold hover:bg-blue-700 shadow-lg shadow-blue-600/15 hover:shadow-blue-600/25 active:scale-98 transition-all gap-2"
          >
            Start Free Account <ArrowRight className="w-4 h-4" />
          </Link>
          <a
            href="#demo"
            className="w-full sm:w-auto inline-flex h-12 items-center justify-center rounded-xl bg-white border border-zinc-200 text-zinc-700 px-8 text-sm font-semibold hover:bg-zinc-50 active:scale-98 transition-all"
          >
            Try Live Sandbox
          </a>
        </div>
      </section>

      {/* Interactive Sandbox Section */}
      <section
        id="demo"
        className="max-w-6xl w-full mx-auto px-6 py-12 scroll-mt-20"
      >
        <div className="bg-white rounded-2xl border border-zinc-200/80 shadow-xl overflow-hidden grid grid-cols-1 lg:grid-cols-12">
          {/* Controls Panel */}
          <div className="lg:col-span-5 p-6 md:p-8 border-r border-zinc-150 flex flex-col gap-6">
            <div>
              <h3 className="text-lg font-bold text-zinc-900 mb-1">
                Interactive Sandbox
              </h3>
              <p className="text-xs text-zinc-550">
                Compose a draft campaign below and see how dynamic tags resolve
                in real-time.
              </p>
            </div>

            {/* Selector */}
            <div className="flex p-1 bg-zinc-100 rounded-xl border border-zinc-200">
              <button
                type="button"
                onClick={() => setCampaignType("email")}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${
                  campaignType === "email"
                    ? "bg-white text-blue-600 shadow-sm border border-zinc-200/50"
                    : "text-zinc-500 hover:text-zinc-800"
                }`}
              >
                <Mail className="w-3.5 h-3.5" /> Email
              </button>
              <button
                type="button"
                onClick={() => setCampaignType("sms")}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${
                  campaignType === "sms"
                    ? "bg-white text-blue-600 shadow-sm border border-zinc-200/50"
                    : "text-zinc-500 hover:text-zinc-800"
                }`}
              >
                <Phone className="w-3.5 h-3.5" /> SMS Text
              </button>
            </div>

            {/* Variables config */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="recipient-name"
                  className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1"
                >
                  Recipient Name ({"{{name}}"})
                </label>
                <input
                  id="recipient-name"
                  type="text"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-zinc-200 focus:outline-none focus:border-blue-500"
                  placeholder="e.g. Sarah"
                />
              </div>
              <div>
                <label
                  htmlFor="company-name"
                  className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1"
                >
                  Company Name ({"{{company}}"})
                </label>
                <input
                  id="company-name"
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-zinc-200 focus:outline-none focus:border-blue-500"
                  placeholder="e.g. Acme Pro"
                />
              </div>
            </div>

            {/* Email Subject field */}
            {campaignType === "email" && (
              <div>
                <label
                  htmlFor="subject-line"
                  className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1"
                >
                  Subject Line
                </label>
                <input
                  id="subject-line"
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-zinc-200 focus:outline-none focus:border-blue-500"
                />
              </div>
            )}

            {/* Campaign Body */}
            <div className="flex-1 flex flex-col">
              <label
                htmlFor="campaign-body"
                className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1"
              >
                Campaign Message Body
              </label>
              <textarea
                id="campaign-body"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={5}
                className="w-full flex-1 text-xs p-3 rounded-lg border border-zinc-200 focus:outline-none focus:border-blue-500 resize-none font-mono leading-relaxed"
              />
            </div>
          </div>

          {/* Visual Preview Device */}
          <div className="lg:col-span-7 bg-zinc-50/50 p-6 md:p-8 flex items-center justify-center border-t lg:border-t-0 lg:border-l border-zinc-150">
            {campaignType === "email" ? (
              // Email Client Mockup
              <div className="w-full max-w-lg rounded-xl border border-zinc-200 bg-white shadow-md overflow-hidden flex flex-col animate-slide-in">
                {/* Email Client Header */}
                <div className="bg-zinc-100/60 border-b border-zinc-200 px-4 py-3 flex flex-col gap-1.5 text-xs">
                  <div className="flex items-center gap-1.5 text-zinc-400">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
                    <span className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                    <span className="w-2.5 h-2.5 rounded-full bg-green-400" />
                    <span className="ml-2 font-medium text-[10px] text-zinc-500">
                      New Message - Preview Mode
                    </span>
                  </div>
                  <div className="grid grid-cols-[60px_1fr] items-center text-zinc-500 mt-1">
                    <span className="font-semibold">From:</span>
                    <span className="text-zinc-800 font-medium">
                      campaigns@mg.
                      {companyName.toLowerCase().replace(/\s+/g, "") ||
                        "cmspro"}
                      .com
                    </span>
                  </div>
                  <div className="grid grid-cols-[60px_1fr] items-center text-zinc-500">
                    <span className="font-semibold">To:</span>
                    <span className="text-zinc-800 font-medium">
                      {clientName.toLowerCase() || "customer"}@example.com
                    </span>
                  </div>
                  <div className="grid grid-cols-[60px_1fr] items-center text-zinc-500">
                    <span className="font-semibold">Subject:</span>
                    <span className="text-blue-600 font-bold">
                      {subject || "(No Subject)"}
                    </span>
                  </div>
                </div>
                {/* Email Content Body */}
                <div className="p-6 text-zinc-800 text-sm min-h-[180px] whitespace-pre-wrap leading-relaxed">
                  {renderPreviewContent(body)}
                </div>
                {/* Email Footer */}
                <div className="bg-zinc-50 border-t border-zinc-100 px-6 py-4 text-center">
                  <span className="text-[10px] text-zinc-400 font-medium">
                    Powered by CMS Pro. Click here to{" "}
                    <span className="text-blue-600 underline cursor-pointer">
                      unsubscribe
                    </span>
                    .
                  </span>
                </div>
              </div>
            ) : (
              // SMS iPhone Mockup
              <div className="w-[280px] h-[520px] rounded-[36px] border-[8px] border-zinc-800 bg-black shadow-lg overflow-hidden flex flex-col relative animate-slide-in">
                {/* Dynamic Island */}
                <div className="absolute top-2 left-1/2 -translate-x-1/2 w-24 h-4 bg-zinc-800 rounded-full z-20 flex items-center justify-center" />

                {/* iPhone Screen Header */}
                <div className="bg-zinc-900 text-white pt-8 pb-3 px-4 flex flex-col items-center gap-1 border-b border-zinc-800 relative">
                  <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-[10px] font-bold text-zinc-300">
                    {clientName.slice(0, 2).toUpperCase() || "CU"}
                  </div>
                  <span className="text-[10px] font-semibold tracking-wide text-zinc-100">
                    {clientName || "Customer"}
                  </span>
                  <span className="text-[8px] text-zinc-500">iMessage</span>
                </div>

                {/* iPhone Messages Thread */}
                <div className="flex-1 bg-zinc-950 p-3 flex flex-col justify-end gap-2 overflow-y-auto">
                  <div className="text-center text-[8px] text-zinc-650 my-2 font-medium">
                    Today 10:42 AM
                  </div>

                  {/* SMS Bubble */}
                  <div className="self-end max-w-[85%] bg-blue-600 text-white rounded-2xl px-3 py-2 text-xs leading-relaxed shadow-sm relative rounded-br-none">
                    <p className="whitespace-pre-wrap">
                      {renderPreviewContent(body)}
                    </p>
                  </div>
                  <div className="self-end text-[7px] text-zinc-500 mr-1">
                    Delivered
                  </div>
                </div>

                {/* iPhone Screen Footer Bar */}
                <div className="bg-zinc-900 border-t border-zinc-800 px-3 py-2.5 flex items-center gap-2">
                  <div className="flex-1 bg-zinc-950 border border-zinc-850 rounded-full px-3 py-1 text-[9px] text-zinc-500">
                    Text Message
                  </div>
                  <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center text-white text-[9px]">
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
        className="max-w-7xl w-full mx-auto px-6 py-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 scroll-mt-20"
      >
        {features.map((feat) => {
          const Icon = feat.icon;
          return (
            <div
              key={feat.title}
              className="p-6 bg-white rounded-2xl border border-zinc-200/70 hover:border-zinc-300 shadow-sm hover:shadow-md transition-all group flex flex-col gap-4"
            >
              <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-zinc-900 mb-1">
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
        className="bg-white border-y border-zinc-200 py-16 scroll-mt-20"
      >
        <div className="max-w-6xl w-full mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="flex flex-col gap-6">
            <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-100 text-blue-600 text-[10px] font-bold uppercase tracking-wider w-fit">
              High Delivery Engine
            </div>
            <h2 className="text-3xl font-extrabold text-zinc-900 tracking-tight font-display">
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
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span className="text-xs font-semibold text-zinc-800">
                  Dynamic tag personalization resolving instantly
                </span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span className="text-xs font-semibold text-zinc-800">
                  Smart opt-in filters for spam compliance
                </span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span className="text-xs font-semibold text-zinc-800">
                  Direct integration with Neon DB serverless workflows
                </span>
              </div>
            </div>
          </div>
          <div className="bg-zinc-50 border border-zinc-200/80 rounded-2xl p-6 md:p-8 flex flex-col gap-6 shadow-inner">
            <h4 className="text-xs font-bold uppercase tracking-widest text-zinc-400">
              Campaign Metrics Overview
            </h4>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-white rounded-xl border border-zinc-200/60 shadow-sm flex flex-col gap-1">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                  SMS Open Rate
                </span>
                <span className="text-3xl font-black text-blue-600 font-display">
                  98.2%
                </span>
                <span className="text-[9px] text-zinc-500">
                  Industry-leading speed
                </span>
              </div>
              <div className="p-4 bg-white rounded-xl border border-zinc-200/60 shadow-sm flex flex-col gap-1">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                  Email Delivery
                </span>
                <span className="text-3xl font-black text-emerald-600 font-display">
                  99.9%
                </span>
                <span className="text-[9px] text-zinc-500">
                  AWS SES architecture
                </span>
              </div>
            </div>

            <div className="p-4 bg-white rounded-xl border border-zinc-200/60 shadow-sm flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                  Total Active Subscribers
                </span>
                <span className="text-xl font-bold text-zinc-800">
                  1,842 clients
                </span>
              </div>
              <div className="w-10 h-10 rounded-full bg-zinc-50 border border-zinc-100 flex items-center justify-center text-zinc-650">
                <Users className="w-4 h-4" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Security & Stack */}
      <section
        id="security"
        className="max-w-5xl w-full mx-auto px-6 py-16 text-center flex flex-col items-center gap-10 scroll-mt-20"
      >
        <div className="flex flex-col gap-3">
          <h3 className="text-2xl font-bold text-zinc-900 tracking-tight">
            Built with modern, secure technology
          </h3>
          <p className="text-xs text-zinc-500 max-w-lg leading-relaxed">
            Your data is stored securely and dispatched using production-ready
            cloud services.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 w-full">
          <div className="bg-white p-5 rounded-xl border border-zinc-200/60 flex flex-col items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-zinc-50 border border-zinc-100 flex items-center justify-center text-zinc-700 font-bold text-xs">
              🔒 Clerk
            </div>
            <div>
              <h5 className="text-xs font-bold text-zinc-900 mb-0.5">
                Secure Authentication
              </h5>
              <p className="text-[10px] text-zinc-550">
                Clerk protects all user directories & credentials.
              </p>
            </div>
          </div>
          <div className="bg-white p-5 rounded-xl border border-zinc-200/60 flex flex-col items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-zinc-50 border border-zinc-100 flex items-center justify-center text-zinc-700 font-bold text-xs">
              ⚡ Neon
            </div>
            <div>
              <h5 className="text-xs font-bold text-zinc-900 mb-0.5">
                Neon Serverless DB
              </h5>
              <p className="text-[10px] text-zinc-550">
                Direct connection pooling for blazing SQL speed.
              </p>
            </div>
          </div>
          <div className="bg-white p-5 rounded-xl border border-zinc-200/60 flex flex-col items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-zinc-50 border border-zinc-100 flex items-center justify-center text-zinc-700 font-bold text-xs">
              ☁️ AWS
            </div>
            <div>
              <h5 className="text-xs font-bold text-zinc-900 mb-0.5">
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
      <section className="max-w-5xl w-full mx-auto px-6 pb-20 mt-4">
        <div className="relative rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 p-8 md:p-12 overflow-hidden shadow-lg shadow-blue-600/10 text-center flex flex-col items-center gap-5">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff0a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0a_1px,transparent_1px)] bg-[size:16px_16px] -z-10" />
          <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight font-display">
            Ready to scale your reach?
          </h2>
          <p className="text-xs md:text-sm text-blue-100 max-w-md leading-relaxed">
            Create an organization, import your contacts list, and draft your
            first dispatch campaign in minutes.
          </p>
          <Link
            href="/sign-up"
            className="inline-flex h-11 items-center justify-center rounded-xl bg-white text-blue-600 px-8 text-xs font-bold hover:bg-zinc-50 shadow-md active:scale-98 transition-all mt-2"
          >
            Create Your Account
          </Link>
        </div>
      </section>
    </div>
  );
}

export default LandingPage;
