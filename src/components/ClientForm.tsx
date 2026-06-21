"use client";

import { useForm } from "@tanstack/react-form";
import { startTransition } from "react";
import {
  useCreateClientMutation,
  useUpdateClientMutation,
} from "../mutations/clients";
import { clientInputSchema } from "../types/schemas";
import type { Client } from "../types/types";
import { getFieldError } from "../utils/form";
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
      onBlur: clientInputSchema,
      onChange: clientInputSchema,
    },
    onSubmit: async ({ value }) => {
      if (isEditMode && client) {
        const updatedClient = {
          ...client,
          name: value.name.trim(),
          email: value.email.trim(),
          phone_number: value.phone_number.trim(),
        };

        // Close modal instantly
        onSuccess();

        startTransition(async () => {
          // Optimistically update parent state
          onOptimisticUpdate?.({ type: "update", client: updatedClient });
          await updateMutation.mutateAsync({
            id: client.id,
            input: {
              name: value.name.trim(),
              email: value.email.trim(),
              phone_number: value.phone_number.trim(),
            },
          });
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
              field.state.meta.isTouched
                ? getFieldError(field.state.meta.errors)
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
              field.state.meta.isTouched
                ? getFieldError(field.state.meta.errors)
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
              field.state.meta.isTouched
                ? getFieldError(field.state.meta.errors)
                : undefined
            }
          />
        )}
      </form.Field>

      {/* Submit Button */}
      <div className="mt-4 flex justify-end gap-3 border-zinc-100 border-t pt-4">
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
