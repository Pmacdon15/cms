"use client";

import { useForm } from "@tanstack/react-form";
import { useCreateCampaignMutation } from "../mutations/campaigns";
import type { MailingList } from "../types/types";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

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
        if (
          (value.type === "email" || value.type === "both") &&
          !value.subject.trim()
        ) {
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
      className="flex flex-col gap-5 bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm"
    >
      <div className="flex flex-col gap-2">
        <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
          Campaign Channel
        </label>
        <form.Field
          name="type"
          children={(field) => (
            <div className="grid grid-cols-3 gap-2 bg-zinc-100/80 p-1 rounded-xl border border-zinc-200/50">
              {(["email", "sms", "both"] as const).map((channel) => (
                <button
                  key={channel}
                  type="button"
                  onClick={() => field.handleChange(channel)}
                  className={`py-2 px-3 text-xs font-semibold uppercase rounded-lg transition-all duration-200 cursor-pointer ${
                    field.state.value === channel
                      ? "bg-blue-600 text-white shadow-sm"
                      : "text-zinc-500 hover:text-zinc-900"
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
          <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
            Target Audience List
          </label>
          <form.Field
            name="mailing_list_name"
            children={(field) => (
              <select
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
                className="flex w-full rounded-xl bg-white border border-zinc-200 px-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus-visible:outline-none focus-visible:border-blue-500 focus-visible:ring-1 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200"
              >
                <option value="">Broadcast to All Clients</option>
                {mailingLists.map((list) => (
                  <option
                    key={list.name}
                    value={list.name}
                    className="bg-white text-zinc-900"
                  >
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
                  error={
                    field.state.meta.errors
                      ? String(field.state.meta.errors)
                      : undefined
                  }
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
            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Message Content
            </label>
            <textarea
              placeholder="Type your newsletter body or SMS text message here..."
              rows={6}
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
              onBlur={field.handleBlur}
              className={`flex w-full rounded-xl bg-white border border-zinc-200 px-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus-visible:outline-none focus-visible:border-blue-500 focus-visible:ring-1 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200 ${
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
          {campaignMutation.isPending
            ? "Sending Campaign..."
            : "Dispatch Campaign"}
        </Button>
      </div>
    </form>
  );
}
export default CampaignForm;
