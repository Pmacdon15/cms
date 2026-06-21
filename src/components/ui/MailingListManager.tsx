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

    if (!result.ok) {
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
    <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-4">
      <MailingListSidebar
        lists={lists}
        activeList={activeList}
        setIsModalOpen={setIsModalOpen}
        selectList={selectList}
      />

      {/* Main Workspace - Client list mapper */}
      <div className="flex flex-col gap-5 lg:col-span-3">
        {!activeList ? (
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
                  {activeList.name}
                </h3>
                <p className="mt-1 text-xs text-zinc-550">
                  {activeList.description ||
                    "Active contact list deployed on AWS SES."}
                </p>
              </div>
              <div className="flex flex-col items-center gap-4 sm:flex-row">
                <MailingListSearchBar
                  initialSearch={search}
                  subscribers={subscribers}
                />
                <span className="flex-shrink-0 rounded-full border border-blue-200/50 bg-zinc-550/10 px-3 py-1.5 font-semibold text-blue-650 text-xs uppercase">
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
