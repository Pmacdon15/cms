"use client";

import { useForm } from "@tanstack/react-form";
import {
  useCreateClientMutation,
  useUpdateClientMutation,
} from "../mutations/clients";
import type { Client } from "../types/types";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

interface ClientFormProps {
  client?: Client;
  onSuccess: () => void;
  onOptimisticUpdate?: (
    action: { type: "update"; client: Client } | { type: "delete"; id: string },
  ) => void;
}

export function ClientForm({
  client,
  onSuccess,
  onOptimisticUpdate,
}: ClientFormProps) {
  const createMutation = useCreateClientMutation(onSuccess);
  const updateMutation = useUpdateClientMutation(onSuccess);

  const isEditMode = !!client;

  // TanStack Form definition
  const form = useForm({
    defaultValues: {
      name: client?.name ?? "",
      email: client?.email ?? "",
      phone_number: client?.phone_number ?? "",
    },
    validators: {
      onChange({ value }) {
        if (!value.name.trim()) return { name: "Name is required" };
        if (!value.email.trim()) return { email: "Email is required" };
        if (!value.email.includes("@"))
          return { email: "Invalid email address" };
        if (!value.phone_number.trim())
          return { phone_number: "Phone is required" };
        return undefined;
      },
    },
    onSubmit: async ({ value }) => {
      if (isEditMode && client) {
        const updatedClient = {
          ...client,
          name: value.name.trim(),
          email: value.email.trim(),
          phone_number: value.phone_number.trim(),
        };

        // Optimistically update parent state
        onOptimisticUpdate?.({ type: "update", client: updatedClient });
        // Close modal instantly
        onSuccess();

        await updateMutation.mutateAsync({
          id: client.id,
          input: {
            name: value.name.trim(),
            email: value.email.trim(),
            phone_number: value.phone_number.trim(),
          },
        });
      } else {
        await createMutation.mutateAsync({
          name: value.name.trim(),
          email: value.email.trim(),
          phone_number: value.phone_number.trim(),
        });
      }
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
      <form.Field name="name">
        {(field) => (
          <Input
            label="Full Name"
            placeholder="John Doe"
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

      {/* Email Input */}
      <form.Field name="email">
        {(field) => (
          <Input
            label="Email Address"
            type="email"
            placeholder="john@example.com"
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

      {/* Phone Number Input */}
      <form.Field name="phone_number">
        {(field) => (
          <Input
            label="Phone Number"
            type="tel"
            placeholder="+1234567890"
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

      {/* Submit Button */}
      <div className="flex justify-end gap-3 mt-4 border-t border-zinc-100 pt-4">
        <Button
          type="submit"
          className="w-full sm:w-auto"
          disabled={
            isEditMode ? updateMutation.isPending : createMutation.isPending
          }
        >
          {isEditMode
            ? updateMutation.isPending
              ? "Saving Changes..."
              : "Save Changes"
            : createMutation.isPending
              ? "Adding Client..."
              : "Add Client Profile"}
        </Button>
      </div>
    </form>
  );
}
