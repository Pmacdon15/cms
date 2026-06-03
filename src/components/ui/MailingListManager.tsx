"use client";

import { CheckCircle, Layers, Mail, Plus, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "../../components/ui/button";
import { Checkbox } from "../../components/ui/checkbox";
import { Dialog } from "../../components/ui/dialog";
import { Input } from "../../components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import {
  useCreateMailingListMutation,
  useUpdateSubscriptionStatusMutation,
} from "../../mutations/mailing_lists";
import type { MailingList } from "../../types/types";

interface MailingListManagerProps {
  initialLists: MailingList[];
  initialSubscribers: Array<{
    id: string;
    name: string;
    email: string;
    phone_number: string;
    status: "subscribed" | "unsubscribed";
  }>;
  activeList: MailingList | null;
}

export function MailingListManager({
  initialLists,
  initialSubscribers,
  activeList,
}: MailingListManagerProps) {
  const router = useRouter();
  const [lists, setLists] = useState<MailingList[]>(initialLists);
  const [subscribers, setSubscribers] = useState(initialSubscribers);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form states for creating a new list on AWS
  const [newListName, setNewListName] = useState("");
  const [newListDesc, setNewListDesc] = useState("");

  // Sync state with incoming server props
  useEffect(() => {
    setLists(initialLists);
  }, [initialLists]);

  useEffect(() => {
    setSubscribers(initialSubscribers);
  }, [initialSubscribers]);

  // Mutations
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

    // Optimistic UI update
    setSubscribers((prev) =>
      prev.map((sub) =>
        sub.id === id ? { ...sub, status: nextStatus } : sub,
      ),
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
      // Revert state on failure
      setSubscribers(initialSubscribers);
    }
  };

  const selectList = (listName: string) => {
    router.push(`/mailing-lists?listName=${listName}`);
  };

  const filteredSubscribers = subscribers.filter(
    (sub) =>
      sub.name.toLowerCase().includes(search.toLowerCase()) ||
      sub.email.toLowerCase().includes(search.toLowerCase()) ||
      sub.phone_number.includes(search),
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
      {/* 1. Sidebar - List Navigator */}
      <div className="lg:col-span-1 flex flex-col gap-4 bg-white p-5 rounded-2xl border border-zinc-200 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-500">
            AWS SES Lists
          </h2>
          <button
            onClick={() => setIsModalOpen(true)}
            className="p-1 rounded-lg bg-zinc-50 border border-zinc-200 hover:bg-zinc-100 text-blue-600 transition-colors cursor-pointer"
            title="Create new list on AWS"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {lists.length === 0 ? (
          <div className="text-center py-8 text-xs text-zinc-500">
            No contact lists found on AWS SES.
          </div>
        ) : (
          <div className="flex flex-col gap-1.5 max-h-[400px] overflow-y-auto pr-1">
            {lists.map((list) => {
              const isActive = activeList?.name === list.name;
              return (
                <button
                  key={list.name}
                  onClick={() => selectList(list.name)}
                  className={`flex flex-col text-left p-3.5 rounded-xl border transition-all cursor-pointer ${
                    isActive
                      ? "bg-blue-50/50 border-blue-200 text-blue-750 font-semibold"
                      : "bg-white border-zinc-200 text-zinc-600 hover:border-zinc-350 hover:bg-zinc-50/50"
                  }`}
                >
                  <span
                    className={`text-sm font-bold ${isActive ? "text-blue-600" : "text-zinc-800"}`}
                  >
                    {list.name}
                  </span>
                  {list.description && (
                    <span className="text-xs text-zinc-500 mt-1 line-clamp-1">
                      {list.description}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* 2. Main Workspace - Client list mapper */}
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
            <div className="bg-white p-5 rounded-2xl border border-zinc-200 flex flex-col sm:flex-row justify-between gap-4 shadow-sm shadow-zinc-100/50">
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
              <div className="flex items-center">
                <span className="text-xs font-semibold uppercase bg-zinc-550/10 text-blue-650 border border-blue-200/50 px-3 py-1.5 rounded-full">
                  {subscribers.filter((s) => s.status === "subscribed").length}{" "}
                  Active Subscribers
                </span>
              </div>
            </div>

            {/* Filter Search */}
            <div className="flex w-full">
              <div className="relative w-full">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input
                  type="text"
                  placeholder={`Search subscribers in ${activeList.name}...`}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full h-11 rounded-xl bg-white border border-zinc-200 pl-10 pr-4 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus-visible:outline-none focus-visible:border-blue-500 focus-visible:ring-1 focus-visible:ring-blue-500 transition-all"
                />
              </div>
            </div>

            {/* Subscribers Table */}
            {filteredSubscribers.length === 0 ? (
              <div className="py-16 text-center border border-zinc-200 rounded-xl bg-white text-zinc-550">
                {search
                  ? "No subscribers match your filter criteria."
                  : "No subscribers on this contact list yet."}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Subscriber Name</TableHead>
                    <TableHead>Contact Info</TableHead>
                    <TableHead className="text-right">
                      Mailing List Status
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSubscribers.map((sub) => {
                    const isSubscribed = sub.status === "subscribed";
                    return (
                      <TableRow key={sub.id}>
                        <TableCell className="font-bold text-zinc-900">
                          {sub.name}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col text-xs text-zinc-500">
                            <span>{sub.email}</span>
                            <span>{sub.phone_number}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Checkbox
                            checked={isSubscribed}
                            onChange={() =>
                              handleToggleSubscription(sub.id, sub.status)
                            }
                            label={isSubscribed ? "Subscribed" : "Opted out"}
                            className="inline-flex cursor-pointer"
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </div>
        )}
      </div>

      {/* Create List Modal Dialog */}
      <Dialog
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create SES Contact List"
      >
        <form onSubmit={handleCreateList} className="flex flex-col gap-4">
          <Input
            label="SES Contact List Name"
            placeholder="e.g. TanStackFormNewsletter, WeeklyDigestPro"
            value={newListName}
            onChange={(e) => setNewListName(e.target.value)}
            required
          />
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
              List Description
            </label>
            <textarea
              placeholder="Provide context about what marketing messages this list will receive..."
              rows={4}
              value={newListDesc}
              onChange={(e) => setNewListDesc(e.target.value)}
              className="flex w-full rounded-xl bg-white border border-zinc-200 px-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus-visible:outline-none focus-visible:border-blue-500 focus-visible:ring-1 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200"
            />
          </div>
          <div className="flex justify-end pt-2 gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createListMutation.isPending}>
              {createListMutation.isPending
                ? "Creating on AWS..."
                : "Create List"}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
