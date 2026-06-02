"use client";

import { useForm } from "@tanstack/react-form";
import { useCreateCampaignMutation } from "../mutations/campaigns";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

import type { MailingList } from "../types/types";

interface CampaignFormProps {
  mailingLists: MailingList[];
  onSuccess?: () => void;
}

export function CampaignForm({ mailingLists, onSuccess }: CampaignFormProps) {
  const campaignMutation = useCreateCampaignMutation(() => {
    form.reset();
    if (onSuccess) onSuccess();
  });

  // TanStack Form configuration
  const form = useForm({
    defaultValues: {
      type: "email" as "email" | "sms" | "both",
      subject: "",
      content: "",
      mailing_list_name: "" as string,
    },
    validators: {
      onChange({ value }) {
        if (!value.content.trim()) {
          return { content: "Message content is required" };
        }
        if ((value.type === "email" || value.type === "both") && !value.subject.trim()) {
          return { subject: "Subject is required for email campaigns" };
        }
        return undefined;
      },
    },
    onSubmit: async ({ value }) => {
      await campaignMutation.mutateAsync({
        type: value.type,
        subject: value.type === "sms" ? undefined : value.subject.trim(),
        content: value.content.trim(),
        mailing_list_name: value.mailing_list_name || undefined,
      });
    },
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        form.handleSubmit();
      }}
      className="flex flex-col gap-5 bg-zinc-950/40 p-6 rounded-2xl border border-zinc-800"
    >
      <div className="flex flex-col gap-2">
        <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
          Campaign Channel
        </label>
        <form.Field
          name="type"
          children={(field) => (
            <div className="grid grid-cols-3 gap-3 bg-zinc-900/60 p-1.5 rounded-xl border border-zinc-900">
              {(["email", "sms", "both"] as const).map((channel) => (
                <button
                  key={channel}
                  type="button"
                  onClick={() => field.handleChange(channel)}
                  className={`py-2 px-3 text-xs font-semibold uppercase rounded-lg transition-all duration-200 cursor-pointer ${
                    field.state.value === channel
                      ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-sm"
                      : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  {channel === "both" ? "Email + SMS" : channel}
                </button>
              ))}
            </div>
          )}
        />
      </div>

      {/* Target Audience List */}
      {mailingLists.length > 0 && (
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Target Audience List
          </label>
          <form.Field
            name="mailing_list_name"
            children={(field) => (
              <select
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
                className="flex w-full rounded-xl bg-zinc-900 border border-zinc-800 px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-500 focus-visible:outline-none focus-visible:border-violet-500 focus-visible:ring-1 focus-visible:ring-violet-550 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200"
              >
                <option value="">Broadcast to All Clients</option>
                {mailingLists.map((list) => (
                  <option key={list.name} value={list.name} className="bg-zinc-950 text-zinc-100">
                    {list.name}
                  </option>
                ))}
              </select>
            )}
          />
        </div>
      )}

      {/* Subject Line (Only shown for Email or Email + SMS) */}
      <form.Subscribe
        selector={(state) => state.values.type}
        children={(type) => {
          if (type === "sms") return null;
          return (
            <form.Field
              name="subject"
              children={(field) => (
                <Input
                  label="Subject Line"
                  placeholder="Enter compelling email subject..."
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                  error={field.state.meta.errors ? String(field.state.meta.errors) : undefined}
                />
              )}
            />
          );
        }}
      />

      {/* Message Body */}
      <form.Field
        name="content"
        children={(field) => (
          <div className="flex flex-col gap-1.5 w-full">
            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Message Content
            </label>
            <textarea
              placeholder="Type your newsletter body or SMS text message here..."
              rows={6}
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
              onBlur={field.handleBlur}
              className={`flex w-full rounded-xl bg-zinc-900 border border-zinc-800 px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-500 focus-visible:outline-none focus-visible:border-violet-500 focus-visible:ring-1 focus-visible:ring-violet-500 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200 ${
                field.state.meta.errors ? "border-rose-500" : ""
              }`}
            />
            {field.state.meta.errors && (
              <span className="text-xs text-rose-500 font-medium">
                {String(field.state.meta.errors)}
              </span>
            )}
          </div>
        )}
      />

      {/* Submit button */}
      <div className="flex justify-end pt-2">
        <Button
          type="submit"
          className="w-full sm:w-auto"
          disabled={campaignMutation.isPending}
        >
          {campaignMutation.isPending ? "Sending Campaign..." : "Dispatch Campaign"}
        </Button>
      </div>
    </form>
  );
}
export default CampaignForm;
