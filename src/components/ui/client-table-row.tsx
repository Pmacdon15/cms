"use client";

import { useClientNavigation } from "@/hooks/useClientNavigation";
import type { Client } from "@/types/types";
import { ClientDeleteButton } from "./client-delete-button";
import { ClientOptInCheckbox } from "./client-opt-in-checkbox";
import { TableCell, TableRow } from "./table";

interface ClientTableRowProps {
  client: Client;
  hasSms: boolean;
  onOptimisticUpdate?: (
    action: { type: "update"; client: Client } | { type: "delete"; id: string },
  ) => void;
}

export function ClientTableRow({
  client,
  hasSms,
  onOptimisticUpdate,
}: ClientTableRowProps) {
  const { handleSelectClient } = useClientNavigation();

  return (
    <TableRow className="cursor-pointer transition-colors hover:bg-blue-50/40">
      <TableCell
        className="font-bold text-zinc-900"
        onClick={() => handleSelectClient(client)}
      >
        {client.name}
      </TableCell>
      <TableCell onClick={() => handleSelectClient(client)}>
        <div className="flex flex-col gap-0.5 text-xs text-zinc-500">
          <span>{client.email}</span>
          <span>{client.phone_number}</span>
        </div>
      </TableCell>
      <TableCell>
        <ClientOptInCheckbox
          client={client}
          channel="email"
          onOptimisticUpdate={onOptimisticUpdate}
        />
      </TableCell>
      {hasSms && (
        <TableCell>
          <ClientOptInCheckbox
            client={client}
            channel="sms"
            onOptimisticUpdate={onOptimisticUpdate}
          />
        </TableCell>
      )}
      <TableCell className="text-right">
        <ClientDeleteButton
          clientId={client.id}
          className="cursor-pointer border-none bg-transparent font-semibold text-rose-500 text-xs hover:text-rose-400 hover:underline"
          label="Delete"
          onBeforeDelete={() => {
            onOptimisticUpdate?.({ type: "delete", id: client.id });
          }}
        />
      </TableCell>
    </TableRow>
  );
}
