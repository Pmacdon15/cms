"use client";

import type * as React from "react";
import { startTransition } from "react";
import { useDeleteClientMutation } from "@/mutations/clients";

interface ClientDeleteButtonProps {
  clientId: string;
  className?: string;
  label?: string;
  onBeforeDelete?: () => void;
}

export function ClientDeleteButton({
  clientId,
  className,
  label = "Delete",
  onBeforeDelete,
}: ClientDeleteButtonProps) {
  const deleteMutation = useDeleteClientMutation();

  const handleDelete = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to remove this client?")) return;
    startTransition(async () => {
      if (onBeforeDelete) onBeforeDelete();
      await deleteMutation.mutateAsync(clientId);
    });
  };

  return (
    <button
      onClick={handleDelete}
      className={className}
      type="button"
      disabled={deleteMutation.isPending}
    >
      {deleteMutation.isPending ? "Removing..." : label}
    </button>
  );
}

export default ClientDeleteButton;
