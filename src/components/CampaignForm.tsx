"use client";

import { useForm } from "@tanstack/react-form";
import { useCreateCampaignMutation } from "../mutations/campaigns";
import type { MailingList } from "../types/types";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

interface CampaignFormProps {
  mailingLists: MailingList[];
  onSuccess?: () => void;
  hasSms: boolean;
}

export function CampaignForm({
  mailingLists,
  onSuccess,
  hasSms,
}: CampaignFormProps) {
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
          (value.type === "email" || value.type === "both" || !hasSms) &&
          !value.subject.trim()
        ) {
          return { subject: "Subject is required for email campaigns" };
        }
        return undefined;
      },
    },
    onSubmit: async ({ value }) => {
      await campaignMutation.mutateAsync({
        type: hasSms ? value.type : "email",
        subject:
          !hasSms || value.type !== "sms" ? value.subject.trim() : undefined,
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
      {hasSms && (
        <div className="flex flex-col gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
            Campaign Channel
          </span>
          <form.Field name="type">
            {(field) => (
              <div className="grid grid-cols-3 gap-2 bg-zinc-100/80 p-1 rounded-xl border border-zinc-200/50">
                {(["email", "sms", "both"] as const).map((channel) => (
                  <button
                    key={channel}
                    type="button"
                    onClick={() => field.handleChange(channel)}
                    className={`py-2 px-3 text-xs font-semibold uppercase rounded-lg transition-all duration-200 cursor-pointer ${
                      field.state.value === channel
                        ? "bg-blue-600 text-white shadow-sm"
                        : "text-zinc-550 hover:text-zinc-900"
                    }`}
                  >
                    {channel === "both" ? "Email + SMS" : channel}
                  </button>
                ))}
              </div>
            )}
          </form.Field>
        </div>
      )}

      {/* Target Audience List */}
      {mailingLists.length > 0 && (
        <div className="flex flex-col gap-2">
          <label
            htmlFor="mailing-list-select"
            className="text-xs font-semibold uppercase tracking-wider text-zinc-500"
          >
            Target Audience List
          </label>
          <form.Field name="mailing_list_name">
            {(field) => (
              <select
                id="mailing-list-select"
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
          </form.Field>
        </div>
      )}

      {/* Subject Line (Only shown for Email or Email + SMS) */}
      <form.Subscribe selector={(state) => state.values.type}>
        {(type) => {
          if (hasSms && type === "sms") return null;
          return (
            <form.Field name="subject">
              {(field) => (
                <Input
                  id="campaign-subject"
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
            </form.Field>
          );
        }}
      </form.Subscribe>

      {/* Message Body */}
      <form.Field name="content">
        {(field) => (
          <div className="flex flex-col gap-1.5 w-full">
            <label
              htmlFor="message-content"
              className="text-xs font-semibold uppercase tracking-wider text-zinc-500"
            >
              Message Content
            </label>
            <textarea
              id="message-content"
              placeholder={
                hasSms
                  ? "Type your newsletter body or SMS text message here..."
                  : "Type your newsletter body here..."
              }
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
      </form.Field>

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
