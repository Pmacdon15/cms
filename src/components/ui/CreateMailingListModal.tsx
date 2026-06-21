"use client";

import { useForm } from "@tanstack/react-form";
import { useEffect } from "react";
import { Button } from "../../components/ui/button";
import { Dialog } from "../../components/ui/dialog";
import { Input } from "../../components/ui/input";
import { mailingListFormSchema } from "../../types/schemas";

interface CreateMailingListModalProps {
  isModalOpen: boolean;
  setIsModalOpen: (open: boolean) => void;
  onSubmit: (values: { name: string; description: string }) => Promise<void>;
  isPending: boolean;
}

export function CreateMailingListModal({
  isModalOpen,
  setIsModalOpen,
  onSubmit,
  isPending,
}: CreateMailingListModalProps) {
  // TanStack Form configuration
  const form = useForm({
    defaultValues: {
      name: "",
      description: "",
    },
    validators: {
      onBlur: mailingListFormSchema,
      onChange: mailingListFormSchema,
    },
    onSubmit: async ({ value }) => {
      await onSubmit({
        name: value.name.trim(),
        description: value.description.trim(),
      });
      form.reset();
    },
  });

  // Reset the form when opening/closing the modal
  useEffect(() => {
    if (!isModalOpen) {
      form.reset();
    }
  }, [isModalOpen, form.reset]);

  return (
    <Dialog
      isOpen={isModalOpen}
      onClose={() => setIsModalOpen(false)}
      title="Create SES Contact List"
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
        className="flex flex-col gap-4"
      >
        {/* List Name Field */}
        <form.Field name="name">
          {(field) => (
            <Input
              label="SES Contact List Name"
              placeholder="e.g. TanStackFormNewsletter, WeeklyDigestPro"
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
              onBlur={field.handleBlur}
              error={
                field.state.meta.errors && field.state.meta.isTouched
                  ? String(field.state.meta.errors)
                  : undefined
              }
            />
          )}
        </form.Field>

        {/* List Description Field */}
        <form.Field name="description">
          {(field) => (
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="description"
                className="font-semibold text-xs text-zinc-500 uppercase tracking-wider"
              >
                List Description
              </label>
              <textarea
                id="description"
                placeholder="Provide context about what marketing messages this list will receive..."
                rows={4}
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
                className={`flex w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 transition-all duration-200 placeholder:text-zinc-400 focus-visible:border-blue-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50 ${
                  field.state.meta.errors && field.state.meta.isTouched
                    ? "border-rose-500"
                    : ""
                }`}
              />
              {field.state.meta.errors && field.state.meta.isTouched && (
                <span className="font-medium text-rose-500 text-xs">
                  {String(field.state.meta.errors)}
                </span>
              )}
            </div>
          )}
        </form.Field>

        {/* Buttons */}
        <div className="flex justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="secondary"
            onClick={() => setIsModalOpen(false)}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending ? "Creating on AWS..." : "Create List"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
