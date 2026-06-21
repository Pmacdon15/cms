"use client";

import { CheckCircle, Mail } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { startTransition, use, useOptimistic, useState } from "react";
import {
  useCreateMailingListMutation,
  useUpdateSubscriptionStatusMutation,
} from "../../mutations/mailing_lists";
import type { MailingList } from "../../types/types";

import { CreateMailingListModal } from "./CreateMailingListModal";
import { MailingListSearchBar } from "./MailingListSearchBar";
import { MailingListSidebar } from "./MailingListSidebar";
import { MailingListSubscribersTable } from "./MailingListSubscribersTable";

interface MailingListManagerProps {
  listsResPromise: Promise<{
    ok: boolean;
    value?: MailingList[];
    error?: unknown;
  }>;
  activeListPromise: Promise<MailingList | null>;
  subscribersResPromise: Promise<{
    ok: boolean;
    value?: Array<{
      id: string;
      name: string;
      email: string;
      phone_number: string;
      status: "subscribed" | "unsubscribed";
    }>;
    error?: unknown;
  }>;
  searchPromise: Promise<string>;
}

export function MailingListManager({
  listsResPromise,
  activeListPromise,
  subscribersResPromise,
  searchPromise,
}: MailingListManagerProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const listsRes = use(listsResPromise);
  const lists = listsRes.ok && listsRes.value ? listsRes.value : [];

  const activeList = use(activeListPromise);

  const initialSubscribersRes = use(subscribersResPromise);
  const initialSubscribers =
    initialSubscribersRes.ok && initialSubscribersRes.value
      ? initialSubscribersRes.value
      : [];

  const search = use(searchPromise) || "";

  const [isModalOpen, setIsModalOpen] = useState(false);

  const [newListName, setNewListName] = useState("");
  const [newListDesc, setNewListDesc] = useState("");

  const [optimisticState, setOptimisticState] = useOptimistic(
    {
      subscribers: initialSubscribers,
      search,
      activeList,
    },
    (
      state,
      action:
        | {
            type: "toggleSubscription";
            id: string;
            status: "subscribed" | "unsubscribed";
          }
        | { type: "selectList"; list: MailingList }
        | { type: "selectSubscriber"; id: string; name: string }
        | { type: "submitSearch"; search: string }
        | { type: "clear" },
    ) => {
      switch (action.type) {
        case "toggleSubscription":
          return {
            ...state,
            subscribers: state.subscribers.map((sub) =>
              sub.id === action.id ? { ...sub, status: action.status } : sub,
            ),
          };
        case "selectList":
          return {
            ...state,
            activeList: action.list,
            search: "",
            subscribers: [],
          };
        case "selectSubscriber":
          return {
            ...state,
            search: action.id,
          };
        case "submitSearch":
          return {
            ...state,
            search: action.search,
          };
        case "clear":
          return {
            ...state,
            search: "",
          };
        default:
          return state;
      }
    },
  );

  const createListMutation = useCreateMailingListMutation(() => {
    setIsModalOpen(false);
    setNewListName("");
    setNewListDesc("");
  });

  const toggleSubscriptionMutation = useUpdateSubscriptionStatusMutation();

  const handleCreateList = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newListName.trim()) return;
    await createListMutation.mutateAsync({
      name: newListName,
      description: newListDesc,
    });
  };

  const handleToggleSubscription = async (
    id: string,
    currentStatus: "subscribed" | "unsubscribed",
  ) => {
    if (!optimisticState.activeList) return;

    const nextStatus =
      currentStatus === "subscribed" ? "unsubscribed" : "subscribed";

    startTransition(async () => {
      setOptimisticState({
        type: "toggleSubscription",
        id,
        status: nextStatus,
      });

      await toggleSubscriptionMutation.mutateAsync({
        clientIdOrEmail: id,
        listName: optimisticState.activeList?.name || "",
        status: nextStatus,
        isPublic: false,
      });
    });
  };

  const selectList = (listName: string) => {
    const targetList = lists.find((l) => l.name === listName) || activeList;
    startTransition(() => {
      if (targetList) {
        setOptimisticState({ type: "selectList", list: targetList });
      }
      const params = new URLSearchParams(searchParams.toString());
      params.set("listName", listName);
      params.delete("client");
      params.delete("search");
      router.push(`/mailing-lists?${params.toString()}`);
    });
  };

  const handleSelectSubscriber = (id: string, name: string) => {
    startTransition(() => {
      setOptimisticState({ type: "selectSubscriber", id, name });
      const params = new URLSearchParams(searchParams.toString());
      params.set("client", id);
      params.delete("search");
      router.push(`/mailing-lists?${params.toString()}`);
    });
  };

  const handleSubmitSearch = (searchTerm: string) => {
    startTransition(() => {
      setOptimisticState({ type: "submitSearch", search: searchTerm });
      const params = new URLSearchParams(searchParams.toString());
      if (searchTerm.trim()) {
        params.set("search", searchTerm.trim());
        params.delete("client");
      } else {
        params.delete("search");
        params.delete("client");
      }
      router.push(`/mailing-lists?${params.toString()}`);
    });
  };

  const handleClearSearch = () => {
    startTransition(() => {
      setOptimisticState({ type: "clear" });
      const params = new URLSearchParams(searchParams.toString());
      params.delete("search");
      params.delete("client");
      router.push(`/mailing-lists?${params.toString()}`);
    });
  };

  const filteredSubscribers = optimisticState.subscribers.filter(
    (sub) =>
      sub.id === optimisticState.search ||
      sub.name.toLowerCase().includes(optimisticState.search.toLowerCase()) ||
      sub.email.toLowerCase().includes(optimisticState.search.toLowerCase()) ||
      sub.phone_number.includes(optimisticState.search),
  );

  return (
    <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-4">
      <MailingListSidebar
        lists={lists}
        activeList={optimisticState.activeList}
        setIsModalOpen={setIsModalOpen}
        selectList={selectList}
      />

      {/* Main Workspace - Client list mapper */}
      <div className="flex flex-col gap-5 lg:col-span-3">
        {!optimisticState.activeList ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-zinc-200 border-dashed py-24 text-center text-zinc-450">
            <Mail className="h-8 w-8 text-zinc-400" />
            <span className="font-semibold text-sm">
              Select or Create an AWS SES Contact List to Manage Subscribers
            </span>
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            {/* Header info */}
            <div className="flex flex-col items-center justify-between gap-4 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm shadow-zinc-100/50 sm:flex-row">
              <div>
                <h3 className="flex items-center gap-2 font-bold text-md text-zinc-900">
                  <CheckCircle className="h-4 w-4 text-blue-600" />{" "}
                  {optimisticState.activeList.name}
                </h3>
                <p className="mt-1 text-xs text-zinc-550">
                  {optimisticState.activeList.description ||
                    "Active contact list deployed on AWS SES."}
                </p>
              </div>
              <div className="flex flex-col items-center gap-4 sm:flex-row">
                <MailingListSearchBar
                  key={`${optimisticState.search}-${optimisticState.activeList.name}`}
                  initialSearch={optimisticState.search}
                  subscribers={optimisticState.subscribers}
                  onSelectSubscriber={handleSelectSubscriber}
                  onSubmitSearch={handleSubmitSearch}
                  onClear={handleClearSearch}
                />
                <span className="shrink-0 rounded-full border border-blue-200/50 bg-zinc-550/10 px-3 py-1.5 font-semibold text-blue-650 text-xs uppercase">
                  {
                    optimisticState.subscribers.filter(
                      (s) => s.status === "subscribed",
                    ).length
                  }{" "}
                  Active
                </span>
              </div>
            </div>

            <MailingListSubscribersTable
              filteredSubscribers={filteredSubscribers}
              search={optimisticState.search}
              handleToggleSubscription={handleToggleSubscription}
            />
          </div>
        )}
      </div>

      <CreateMailingListModal
        isModalOpen={isModalOpen}
        setIsModalOpen={setIsModalOpen}
        handleCreateList={handleCreateList}
        newListName={newListName}
        setNewListName={setNewListName}
        newListDesc={newListDesc}
        setNewListDesc={setNewListDesc}
        isPending={createListMutation.isPending}
      />
    </div>
  );
}

export default MailingListManager;
