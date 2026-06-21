"use client";

import { startTransition, use, useOptimistic, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useClientNavigation } from "@/hooks/useClientNavigation";
import { actionGetClients } from "../actions/clients";
import type { Client } from "../types/types";
import { ClientForm } from "./ClientForm";
import { ClientSearchBar } from "./ClientSearchBar";
import { Button } from "./ui/button";
import { ClientDetailView } from "./ui/client-detailed-view";
import { ClientTable } from "./ui/client-table";
import { Dialog } from "./ui/dialog";

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
  currentClientPromise,
}: ClientListProps) {
  const router = useRouter();
  const currentClient = use(currentClientPromise);
  const clientsResult = use(initialClientsPromise);
  const clients = clientsResult.ok ? clientsResult.value : [];
  const currentSearch = use(currentSearchPromise);
  const hasSms = use(hasSmsPromise);

  const [isModalOpen, setIsModalOpen] = useState(false);

  // Fetch the default (unfiltered) list of clients on load
  const { data: baseClients = (currentSearch ? [] : clients) } = useQuery({
    queryKey: ["client-base-list"],
    queryFn: async () => {
      const res = await actionGetClients();
      if (res.ok) return res.value as Client[];
      return [];
    },
    staleTime: 1000 * 60 * 5, // cache for 5 minutes
  });

  const handleClear = () => {
    startTransition(() => {
      setOptimisticState({
        type: "submitSearch",
        search: "",
        clients: baseClients,
      });
      router.push("/clients");
    });
  };

  const [optimisticState, setOptimisticState] = useOptimistic(
    {
      clients,
      currentClient,
      currentSearch,
    },
    (
      state,
      action:
        | { type: "update"; client: Client }
        | { type: "delete"; id: string }
        | { type: "selectClient"; id: string; client: Client }
        | { type: "submitSearch"; search: string; clients: Client[] },
    ) => {
      switch (action.type) {
        case "update":
          return {
            ...state,
            clients: state.clients.map((c) =>
              c.id === action.client.id ? action.client : c,
            ),
          };
        case "delete":
          return {
            ...state,
            clients: state.clients.filter((c) => c.id !== action.id),
          };
        case "selectClient":
          return {
            ...state,
            currentClient: action.id,
            currentSearch: "",
            clients: [action.client],
          };
        case "submitSearch":
          return {
            ...state,
            currentClient: "",
            currentSearch: action.search,
            clients: action.clients,
          };
        default:
          return state;
      }
    },
  );

  const selectedClient = optimisticState.currentClient
    ? optimisticState.clients.find(
        (c) => c.id === optimisticState.currentClient,
      ) || null
    : null;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <ClientSearchBar
          key={`${optimisticState.currentSearch}-${selectedClient?.id || ""}`}
          initialSearch={optimisticState.currentSearch}
          selectedClientName={selectedClient?.name}
          onOptimisticUpdate={setOptimisticState}
          onClear={handleClear}
        />
        <Button
          onClick={() => setIsModalOpen(true)}
          className="w-full sm:w-auto"
        >
          Add New Client
        </Button>
      </div>

      {optimisticState.currentSearch && !selectedClient && (
        <div className="flex items-center gap-2 text-sm">
          <span className="text-zinc-500">
            Showing results for{" "}
            <span className="font-semibold text-zinc-800">
              &ldquo;{optimisticState.currentSearch}&rdquo;
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
          onOptimisticUpdate={setOptimisticState}
        />
      ) : (
        <ClientTable
          clients={optimisticState.clients}
          hasSms={hasSms}
          currentSearch={optimisticState.currentSearch}
          onOptimisticUpdate={setOptimisticState}
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
          }}
        />
      </Dialog>
    </div>
  );
}
