"use client";

import type { Client } from "@/types/types";
import { ClientTableRow } from "./client-table-row";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "./table";

interface ClientTableProps {
  clients: Client[];
  hasSms: boolean;
  currentSearch: string;
  onSelectClient: (client: Client) => void;
}

export function ClientTable({
  clients,
  hasSms,
  currentSearch,
  onSelectClient,
}: ClientTableProps) {
  if (clients.length === 0) {
    return (
      <div className="rounded-xl border border-zinc-200 bg-white py-16 text-center text-zinc-500">
        {currentSearch
          ? "No clients match your search criteria."
          : "No clients registered yet."}
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Client Name</TableHead>
          <TableHead>Contact Info</TableHead>
          <TableHead>Newsletter (Email)</TableHead>
          {hasSms && <TableHead>SMS (Phone)</TableHead>}
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {clients.map((client) => (
          <ClientTableRow
            key={client.id}
            client={client}
            hasSms={hasSms}
            onSelectClient={onSelectClient}
          />
        ))}
      </TableBody>
    </Table>
  );
}
