"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { type ComponentType, use, useEffect, useState } from "react";
import type { Client } from "../types/types";
import { ClientForm } from "./ClientForm";
import { ClientSearchBar } from "./ClientSearchBar";
import { Button } from "./ui/button";
import { ClientDetailView } from "./ui/client-detailed-view";
import { ClientTable } from "./ui/client-table";
import { Dialog } from "./ui/dialog";

const ClientSearchBarComponent = ClientSearchBar as ComponentType<{
  currentSearch: string;
  onSelectClient: (client: Client) => void;
  onClear: () => void;
  buildUrl: (overrides: Record<string, string>) => string;
  selectedClientName?: string;
}>;

interface ClientListProps {
  initialClientsPromise: Promise<
    { ok: true; value: Client[] } | { ok: false; error: unknown }
  >;
  hasSmsPromise: Promise<boolean>;
  currentSearchPromise: Promise<string>;
  currentClientPromise: Promise<string>;
}

export default function ClientList({
  initialClientsPromise,
  hasSmsPromise,
  currentSearchPromise,
}: ClientListProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const clientsResult = use(initialClientsPromise);
  const clients = clientsResult.ok ? clientsResult.value : [];
  const currentSearch = use(currentSearchPromise);
  const hasSms = use(hasSmsPromise);

  const activeClientId = searchParams.get("client");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [localClients, setLocalClients] = useState<Client[]>([]);

  useEffect(() => {
    setLocalClients(clients);
  }, [clients]);

  const selectedClient = activeClientId
    ? localClients.find((c) => c.id === activeClientId) || null
    : null;

  const buildUrl = (overrides: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("search");
    params.delete("client");
    for (const [key, val] of Object.entries(overrides)) {
      if (val) params.set(key, val);
    }
    const qs = params.toString();
    return qs ? `/clients?${qs}` : "/clients";
  };

  const handleSelectClient = (client: Client) => {
    router.push(buildUrl({ client: client.id }));
  };

  const handleClear = () => {
    router.push(buildUrl({}));
  };

  const handleOptimisticUpdate = (
    action: { type: "update"; client: Client } | { type: "delete"; id: string },
  ) => {
    if (action.type === "update") {
      setLocalClients((prev) =>
        prev.map((c) => (c.id === action.client.id ? action.client : c)),
      );
    } else if (action.type === "delete") {
      setLocalClients((prev) => prev.filter((c) => c.id !== action.id));
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <ClientSearchBarComponent
          currentSearch={currentSearch}
          onSelectClient={handleSelectClient}
          onClear={handleClear}
          buildUrl={buildUrl}
          selectedClientName={selectedClient?.name}
        />
        <Button
          onClick={() => setIsModalOpen(true)}
          className="w-full sm:w-auto"
        >
          Add New Client
        </Button>
      </div>

      {currentSearch && !selectedClient && (
        <div className="flex items-center gap-2 text-sm">
          <span className="text-zinc-500">
            Showing results for{" "}
            <span className="font-semibold text-zinc-800">
              &ldquo;{currentSearch}&rdquo;
            </span>
          </span>
          <button
            type="button"
            onClick={handleClear}
            className="cursor-pointer font-semibold text-blue-600 text-xs hover:text-blue-700"
          >
            Clear
          </button>
        </div>
      )}

      {selectedClient ? (
        <ClientDetailView
          client={selectedClient}
          hasSms={hasSms}
          onBack={handleClear}
          onOptimisticUpdate={handleOptimisticUpdate}
        />
      ) : (
        <ClientTable
          clients={localClients}
          hasSms={hasSms}
          currentSearch={currentSearch}
          onSelectClient={handleSelectClient}
        />
      )}

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
