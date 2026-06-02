"use client";

import { useForm } from "@tanstack/react-form";
import { useCreateClientMutation } from "../mutations/clients";
import { Button } from "./ui/button";
import { Checkbox } from "./ui/checkbox";
import { Input } from "./ui/input";

interface ClientFormProps {
  onSuccess: () => void;
}

export function ClientForm({ onSuccess }: ClientFormProps) {
  const createMutation = useCreateClientMutation(onSuccess);

  // TanStack Form definition
  const form = useForm({
    defaultValues: {
      name: "",
      email: "",
      phone_number: "",
      opt_in_newsletter: true,
      opt_in_sms: true,
    },
    validators: {
      onChange({ value }) {
        if (!value.name.trim()) return { name: "Name is required" };
        if (!value.email.trim()) return { email: "Email is required" };
        if (!value.email.includes("@")) return { email: "Invalid email address" };
        if (!value.phone_number.trim()) return { phone_number: "Phone is required" };
        return undefined;
      },
    },
    onSubmit: async ({ value }) => {
      await createMutation.mutateAsync({
        name: value.name.trim(),
        email: value.email.trim(),
        phone_number: value.phone_number.trim(),
        opt_in_newsletter: value.opt_in_newsletter,
        opt_in_sms: value.opt_in_sms,
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
      className="flex flex-col gap-5"
    >
      {/* Name Input */}
      <form.Field
        name="name"
        children={(field) => (
          <Input
            label="Full Name"
            placeholder="John Doe"
            value={field.state.value}
            onChange={(e) => field.handleChange(e.target.value)}
            onBlur={field.handleBlur}
            error={field.state.meta.errors ? String(field.state.meta.errors) : undefined}
          />
        )}
      />

      {/* Email Input */}
      <form.Field
        name="email"
        children={(field) => (
          <Input
            label="Email Address"
            type="email"
            placeholder="john@example.com"
            value={field.state.value}
            onChange={(e) => field.handleChange(e.target.value)}
            onBlur={field.handleBlur}
            error={field.state.meta.errors ? String(field.state.meta.errors) : undefined}
          />
        )}
      />

      {/* Phone Number Input */}
      <form.Field
        name="phone_number"
        children={(field) => (
          <Input
            label="Phone Number"
            type="tel"
            placeholder="+1234567890"
            value={field.state.value}
            onChange={(e) => field.handleChange(e.target.value)}
            onBlur={field.handleBlur}
            error={field.state.meta.errors ? String(field.state.meta.errors) : undefined}
          />
        )}
      />

      {/* Subscription Preferences */}
      <div className="flex flex-col gap-3 mt-1 border-t border-zinc-900 pt-4">
        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
          Subscribed Channels
        </span>
        <div className="flex flex-wrap gap-x-6 gap-y-2 mt-1">
          <form.Field
            name="opt_in_newsletter"
            children={(field) => (
              <Checkbox
                label="Opt-in to Emails (Newsletter)"
                checked={field.state.value}
                onChange={(e) => field.handleChange(e.target.checked)}
              />
            )}
          />

          <form.Field
            name="opt_in_sms"
            children={(field) => (
              <Checkbox
                label="Opt-in to SMS Updates"
                checked={field.state.value}
                onChange={(e) => field.handleChange(e.target.checked)}
              />
            )}
          />
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex justify-end gap-3 mt-4 border-t border-zinc-900 pt-4">
        <Button
          type="submit"
          className="w-full sm:w-auto"
          disabled={createMutation.isPending}
        >
          {createMutation.isPending ? "Adding Client..." : "Add Client Profile"}
        </Button>
      </div>
    </form>
  );
}
