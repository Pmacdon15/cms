"use client";

import { ArrowLeft, Mail, Phone, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  useDeleteClientMutation,
  useUpdateClientOptInMutation,
} from "../../mutations/clients";
import type { Client } from "../../types/types";
import { Checkbox } from "../ui/checkbox";

interface ClientDetailViewProps {
  client: Client;
  hasSms: boolean;
  onBack: () => void;
}

export function ClientDetailView({
  client,
  hasSms,
  onBack,
}: ClientDetailViewProps) {
  const router = useRouter();
  const deleteMutation = useDeleteClientMutation();
  const optInMutation = useUpdateClientOptInMutation();

  const [optInNewsletter, setOptInNewsletter] = useState(
    client.opt_in_newsletter,
  );
  const [optInSms, setOptInSms] = useState(client.opt_in_sms);

  useEffect(() => {
    setOptInNewsletter(client.opt_in_newsletter);
    setOptInSms(client.opt_in_sms);
  }, [client]);

  const handleOptInToggle = async (
    channel: "email" | "sms",
    checked: boolean,
  ) => {
    const nextNewsletter = channel === "email" ? checked : optInNewsletter;
    const nextSms = channel === "sms" ? checked : optInSms;

    if (channel === "email") setOptInNewsletter(checked);
    if (channel === "sms") setOptInSms(checked);

    const result = await optInMutation.mutateAsync({
      id: client.id,
      optInNewsletter: nextNewsletter,
      optInSms: nextSms,
    });

    if (result.ok) {
      router.refresh();
    } else {
      if (channel === "email") setOptInNewsletter(!checked);
      if (channel === "sms") setOptInSms(!checked);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to remove this client?")) return;
    const result = await deleteMutation.mutateAsync(client.id);
    if (result.ok) {
      onBack();
      router.refresh();
    }
  };

  const initials = client.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="animate-fade-in-scale">
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-800 font-medium mb-4 transition-colors cursor-pointer group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
        Back to all clients
      </button>

      <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm overflow-hidden">
        <div className="relative h-24 bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600" />
        <div className="px-6 pb-6">
          <div className="-mt-10 mb-5 flex items-end justify-between">
            <div className="relative z-10 w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-extrabold text-2xl border-4 border-white shadow-lg">
              {initials}
            </div>
            <button
              onClick={handleDelete}
              className="text-xs font-semibold text-rose-500 hover:text-rose-600 hover:bg-rose-50 px-3 py-1.5 rounded-lg border border-rose-200 transition-all cursor-pointer"
              type="button"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Removing..." : "Delete Client"}
            </button>
          </div>

          <h2 className="text-2xl font-extrabold text-zinc-900 tracking-tight mb-1">
            {client.name}
          </h2>
          <p className="text-sm text-zinc-500 mb-6">
            Client since{" "}
            {new Date(client.created_at).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="flex items-center gap-3 p-4 rounded-xl bg-zinc-50 border border-zinc-100">
              <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
                <Mail className="w-4 h-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  Email
                </span>
                <span className="text-sm font-medium text-zinc-900">
                  {client.email}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 rounded-xl bg-zinc-50 border border-zinc-100">
              <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
                <Phone className="w-4 h-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  Phone
                </span>
                <span className="text-sm font-medium text-zinc-900">
                  {client.phone_number}
                </span>
              </div>
            </div>
          </div>

          <div className="border-t border-zinc-100 pt-5">
            <h3 className="text-sm font-bold text-zinc-800 mb-3 flex items-center gap-2">
              <User className="w-4 h-4 text-blue-600" /> Subscription
              Preferences
            </h3>
            <div
              className={`grid grid-cols-1 gap-3 ${hasSms ? "md:grid-cols-2" : ""}`}
            >
              <div className="flex items-center justify-between p-4 rounded-xl bg-zinc-50 border border-zinc-100">
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-semibold text-zinc-800">
                    Email Newsletter
                  </span>
                  <span className="text-xs text-zinc-500">
                    Receive campaigns via email
                  </span>
                </div>
                <Checkbox
                  checked={optInNewsletter}
                  onChange={(e) => handleOptInToggle("email", e.target.checked)}
                  label={optInNewsletter ? "Subscribed" : "Opted out"}
                />
              </div>

              {hasSms && (
                <div className="flex items-center justify-between p-4 rounded-xl bg-zinc-50 border border-zinc-100">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-semibold text-zinc-800">
                      SMS Messages
                    </span>
                    <span className="text-xs text-zinc-500">
                      Receive campaigns via text
                    </span>
                  </div>
                  <Checkbox
                    checked={optInSms}
                    onChange={(e) => handleOptInToggle("sms", e.target.checked)}
                    label={optInSms ? "Subscribed" : "Opted out"}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
