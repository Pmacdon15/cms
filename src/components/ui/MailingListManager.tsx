"use client";

import { CheckCircle, Mail } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { use, useEffect, useState } from "react";
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

  const [subscribers, setSubscribers] = useState(initialSubscribers);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [newListName, setNewListName] = useState("");
  const [newListDesc, setNewListDesc] = useState("");

  useEffect(() => {
    setSubscribers(initialSubscribers);
  }, [initialSubscribers]);

  const createListMutation = useCreateMailingListMutation(() => {
    setIsModalOpen(false);
    setNewListName("");
    setNewListDesc("");
    router.refresh();
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
    if (!activeList) return;

    const nextStatus =
      currentStatus === "subscribed" ? "unsubscribed" : "subscribed";

    setSubscribers((prev) =>
      prev.map((sub) => (sub.id === id ? { ...sub, status: nextStatus } : sub)),
    );

    const result = await toggleSubscriptionMutation.mutateAsync({
      clientIdOrEmail: id,
      listName: activeList.name,
      status: nextStatus,
      isPublic: false,
    });

    if (result.ok) {
      router.refresh();
    } else {
      setSubscribers(initialSubscribers);
    }
  };

  const selectList = (listName: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("listName", listName);
    router.push(`/mailing-lists?${params.toString()}`);
  };

  const filteredSubscribers = subscribers.filter(
    (sub) =>
      sub.id === search ||
      sub.name.toLowerCase().includes(search.toLowerCase()) ||
      sub.email.toLowerCase().includes(search.toLowerCase()) ||
      sub.phone_number.includes(search),
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
      <MailingListSidebar
        lists={lists}
        activeList={activeList}
        setIsModalOpen={setIsModalOpen}
        selectList={selectList}
      />

      {/* Main Workspace - Client list mapper */}
      <div className="lg:col-span-3 flex flex-col gap-5">
        {!activeList ? (
          <div className="py-24 text-center border border-dashed border-zinc-200 rounded-2xl text-zinc-450 flex flex-col items-center gap-3">
            <Mail className="w-8 h-8 text-zinc-400" />
            <span className="text-sm font-semibold">
              Select or Create an AWS SES Contact List to Manage Subscribers
            </span>
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            {/* Header info */}
            <div className="bg-white p-5 rounded-2xl border border-zinc-200 flex flex-col sm:flex-row justify-between items-center gap-4 shadow-sm shadow-zinc-100/50">
              <div>
                <h3 className="text-md font-bold text-zinc-900 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-blue-600" />{" "}
                  {activeList.name}
                </h3>
                <p className="text-xs text-zinc-550 mt-1">
                  {activeList.description ||
                    "Active contact list deployed on AWS SES."}
                </p>
              </div>
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <MailingListSearchBar
                  initialSearch={search}
                  subscribers={subscribers}
                />
                <span className="text-xs font-semibold uppercase bg-zinc-550/10 text-blue-650 border border-blue-200/50 px-3 py-1.5 rounded-full flex-shrink-0">
                  {subscribers.filter((s) => s.status === "subscribed").length}{" "}
                  Active
                </span>
              </div>
            </div>

            <MailingListSubscribersTable
              filteredSubscribers={filteredSubscribers}
              search={search}
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
