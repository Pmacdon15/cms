"use client";

import { ArrowLeft, Mail, Phone, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  useDeleteClientMutation,
  useUpdateClientOptInMutation,
} from "../../mutations/clients";
import type { Client } from "../../types/types";
import { ClientForm } from "../ClientForm";
import { Checkbox } from "../ui/checkbox";
import { Dialog } from "./dialog";

interface ClientDetailViewProps {
  client: Client;
  hasSms: boolean;
  onBack: () => void;
  onOptimisticUpdate?: (
    action: { type: "update"; client: Client } | { type: "delete"; id: string },
  ) => void;
}

export function ClientDetailView({
  client,
  hasSms,
  onBack,
  onOptimisticUpdate,
}: ClientDetailViewProps) {
  const router = useRouter();
  const deleteMutation = useDeleteClientMutation();
  const optInMutation = useUpdateClientOptInMutation();

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
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
    onOptimisticUpdate?.({ type: "delete", id: client.id });
    onBack();
    await deleteMutation.mutateAsync(client.id);
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
        className="group mb-4 flex cursor-pointer items-center gap-1.5 font-medium text-sm text-zinc-500 transition-colors hover:text-zinc-800"
      >
        <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
        Back to all clients
      </button>

      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
        <div className="relative h-24 bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600" />
        <div className="px-6 pb-6">
          <div className="-mt-10 mb-5 flex items-end justify-between">
            <div className="relative z-10 flex h-20 w-20 items-center justify-center rounded-2xl border-4 border-white bg-gradient-to-br from-blue-500 to-blue-700 font-extrabold text-2xl text-white shadow-lg">
              {initials}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setIsEditModalOpen(true)}
                className="cursor-pointer rounded-lg border border-zinc-200 bg-white px-3 py-1.5 font-semibold text-xs text-zinc-600 shadow-sm transition-all hover:bg-zinc-50 hover:text-zinc-800"
                type="button"
              >
                Edit Profile
              </button>
              <button
                onClick={handleDelete}
                className="cursor-pointer rounded-lg border border-rose-200 bg-white px-3 py-1.5 font-semibold text-rose-500 text-xs shadow-sm transition-all hover:bg-rose-50 hover:text-rose-600"
                type="button"
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? "Removing..." : "Delete Client"}
              </button>
            </div>
          </div>

          <h2 className="mb-1 font-extrabold text-2xl text-zinc-900 tracking-tight">
            {client.name}
          </h2>
          <p className="mb-6 text-sm text-zinc-500">
            Client since{" "}
            {new Date(client.created_at).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>

          <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="flex items-center gap-3 rounded-xl border border-zinc-100 bg-zinc-50 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-blue-100 bg-blue-50 text-blue-600">
                <Mail className="h-4 w-4" />
              </div>
              <div className="flex flex-col">
                <span className="font-semibold text-xs text-zinc-400 uppercase tracking-wider">
                  Email
                </span>
                <span className="font-medium text-sm text-zinc-900">
                  {client.email}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-xl border border-zinc-100 bg-zinc-50 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-blue-100 bg-blue-50 text-blue-600">
                <Phone className="h-4 w-4" />
              </div>
              <div className="flex flex-col">
                <span className="font-semibold text-xs text-zinc-400 uppercase tracking-wider">
                  Phone
                </span>
                <span className="font-medium text-sm text-zinc-900">
                  {client.phone_number}
                </span>
              </div>
            </div>
          </div>

          <div className="border-zinc-100 border-t pt-5">
            <h3 className="mb-3 flex items-center gap-2 font-bold text-sm text-zinc-800">
              <User className="h-4 w-4 text-blue-600" /> Subscription
              Preferences
            </h3>
            <div
              className={`grid grid-cols-1 gap-3 ${hasSms ? "md:grid-cols-2" : ""}`}
            >
              <div className="flex items-center justify-between rounded-xl border border-zinc-100 bg-zinc-50 p-4">
                <div className="flex flex-col gap-0.5">
                  <span className="font-semibold text-sm text-zinc-800">
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
                <div className="flex items-center justify-between rounded-xl border border-zinc-100 bg-zinc-50 p-4">
                  <div className="flex flex-col gap-0.5">
                    <span className="font-semibold text-sm text-zinc-800">
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
      <Dialog
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Client Profile"
      >
        <ClientForm
          client={client}
          onSuccess={() => {
            setIsEditModalOpen(false);
            router.refresh();
          }}
          onOptimisticUpdate={onOptimisticUpdate}
        />
      </Dialog>
    </div>
  );
}
