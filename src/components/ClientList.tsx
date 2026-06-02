"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  useDeleteClientMutation,
  useUpdateClientOptInMutation,
} from "../mutations/clients";
import type { Client } from "../types/types";
import { ClientForm } from "./ClientForm";
import { Button } from "./ui/button";
import { Checkbox } from "./ui/checkbox";
import { Dialog } from "./ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";

interface ClientListProps {
  initialClients: Client[];
}

export function ClientList({ initialClients }: ClientListProps) {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>(initialClients);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Sync state with server props
  useEffect(() => {
    setClients(initialClients);
  }, [initialClients]);

  // Mutations
  const deleteMutation = useDeleteClientMutation();
  const optInMutation = useUpdateClientOptInMutation();

  const handleOptInToggle = async (
    client: Client,
    channel: "email" | "sms",
    checked: boolean,
  ) => {
    const updatedNewsletter =
      channel === "email" ? checked : client.opt_in_newsletter;
    const updatedSms = channel === "sms" ? checked : client.opt_in_sms;

    // Optimistic UI update
    setClients((prev) =>
      prev.map((c) =>
        c.id === client.id
          ? {
              ...c,
              opt_in_newsletter: updatedNewsletter,
              opt_in_sms: updatedSms,
            }
          : c,
      ),
    );

    const result = await optInMutation.mutateAsync({
      id: client.id,
      optInNewsletter: updatedNewsletter,
      optInSms: updatedSms,
    });

    if (result.ok) {
      router.refresh();
    } else {
      // Revert on failure
      setClients(initialClients);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to remove this client?")) return;
    const result = await deleteMutation.mutateAsync(id);
    if (result.ok) {
      router.refresh();
    }
  };

  // Filter clients based on search query
  const filteredClients = clients.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase()) ||
      c.phone_number.includes(search),
  );

  return (
    <div className="flex flex-col gap-6">
      {/* Action panel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <input
          type="text"
          placeholder="Search by name, email, or phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 max-w-md h-11 rounded-xl bg-white border border-zinc-200 px-4 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus-visible:outline-none focus-visible:border-blue-500 focus-visible:ring-1 focus-visible:ring-blue-500 transition-all"
        />
        <Button
          onClick={() => setIsModalOpen(true)}
          className="w-full sm:w-auto"
        >
          Add New Client
        </Button>
      </div>

      {/* Database Table */}
      {filteredClients.length === 0 ? (
        <div className="py-16 text-center text-zinc-550 border border-zinc-200 rounded-xl bg-white">
          {search
            ? "No clients match your filter criteria."
            : "No clients registered yet."}
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Client Name</TableHead>
              <TableHead>Contact Info</TableHead>
              <TableHead>Newsletter (Email)</TableHead>
              <TableHead>SMS (Phone)</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredClients.map((client) => (
              <TableRow key={client.id}>
                <TableCell className="font-bold text-zinc-900">
                  {client.name}
                </TableCell>
                <TableCell>
                  <div className="flex flex-col text-xs gap-0.5 text-zinc-500">
                    <span>{client.email}</span>
                    <span>{client.phone_number}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Checkbox
                    checked={client.opt_in_newsletter}
                    onChange={(e) =>
                      handleOptInToggle(client, "email", e.target.checked)
                    }
                    label={
                      client.opt_in_newsletter ? "Subscribed" : "Opted out"
                    }
                  />
                </TableCell>
                <TableCell>
                  <Checkbox
                    checked={client.opt_in_sms}
                    onChange={(e) =>
                      handleOptInToggle(client, "sms", e.target.checked)
                    }
                    label={client.opt_in_sms ? "Subscribed" : "Opted out"}
                  />
                </TableCell>
                <TableCell className="text-right">
                  <button
                    onClick={() => handleDelete(client.id)}
                    className="text-xs font-semibold text-rose-500 hover:text-rose-400 hover:underline cursor-pointer border-none bg-transparent"
                    type="button"
                  >
                    Delete
                  </button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* Add Client Glassmorphic Modal Dialog */}
      <Dialog
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Register Client Profile"
      >
        <ClientForm
          onSuccess={() => {
            setIsModalOpen(false);
            router.refresh();
          }}
        />
      </Dialog>
    </div>
  );
}
export default ClientList;
