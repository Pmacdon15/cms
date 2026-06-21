"use client";

import { Check, Edit2, Plus, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  useDeleteMailingListMutation,
  useEditMailingListMutation,
} from "../../mutations/mailing_lists";
import type { MailingList } from "../../types/types";

export function MailingListSidebar({
  lists,
  activeList,
  setIsModalOpen,
  selectList,
}: {
  lists: MailingList[];
  activeList: MailingList | null;
  setIsModalOpen: (open: boolean) => void;
  selectList: (listName: string) => void;
}) {
  const router = useRouter();
  const [editingListName, setEditingListName] = useState<string | null>(null);
  const [editNameValue, setEditNameValue] = useState("");
  const [editDescValue, setEditDescValue] = useState("");

  const deleteMutation = useDeleteMailingListMutation(() => {
    router.refresh();
  });

  const editMutation = useEditMailingListMutation(() => {
    setEditingListName(null);
    router.refresh();
  });

  const handleDelete = async (e: React.MouseEvent, name: string) => {
    e.stopPropagation();
    if (
      window.confirm(
        `Are you sure you want to delete the mailing list "${name}"?`,
      )
    ) {
      await deleteMutation.mutateAsync({ name });
    }
  };

  const handleStartEdit = (e: React.MouseEvent, list: MailingList) => {
    e.stopPropagation();
    setEditingListName(list.name);
    setEditNameValue(list.name);
    setEditDescValue(list.description || "");
  };

  const handleSaveEdit = async (e: React.FormEvent, oldName: string) => {
    e.preventDefault();
    if (!editNameValue.trim()) return;
    await editMutation.mutateAsync({
      oldName,
      newName: editNameValue,
      description: editDescValue,
    });
  };

  const handleCancelEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingListName(null);
  };

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm lg:col-span-1">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-xs text-zinc-500 uppercase tracking-wider">
          AWS SES Lists
        </h2>
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="cursor-pointer rounded-lg border border-zinc-200 bg-zinc-50 p-1 text-blue-600 transition-colors hover:bg-zinc-100"
          title="Create new list on AWS"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      {lists.length === 0 ? (
        <div className="py-8 text-center text-xs text-zinc-500">
          No contact lists found on AWS SES.
        </div>
      ) : (
        <div className="flex max-h-[400px] flex-col gap-1.5 overflow-y-auto pr-1">
          {lists.map((list) => {
            const isActive = activeList?.name === list.name;
            const sent = list.campaignsSentThisWeek ?? 0;
            const limit = list.campaignLimit;
            const hasLimit = typeof limit === "number";
            const left = hasLimit ? Math.max(0, limit - sent) : Infinity;
            const percent =
              hasLimit && limit > 0 ? Math.min(100, (sent / limit) * 100) : 0;

            let barColor = "bg-blue-600";
            if (percent >= 90) {
              barColor = "bg-rose-500";
            } else if (percent >= 70) {
              barColor = "bg-amber-500";
            }

            return (
              <div key={list.name} className="group relative w-full">
                {editingListName === list.name ? (
                  <form
                    onSubmit={(e) => handleSaveEdit(e, list.name)}
                    className="flex flex-col gap-2 rounded-xl border border-zinc-200 bg-zinc-50 p-3"
                  >
                    <input
                      type="text"
                      value={editNameValue}
                      onChange={(e) => setEditNameValue(e.target.value)}
                      className="w-full rounded-lg border border-zinc-250 bg-white px-2.5 py-1.5 font-semibold text-xs text-zinc-900 focus-visible:border-blue-500 focus-visible:outline-none"
                      placeholder="List name..."
                      required
                    />
                    <input
                      type="text"
                      value={editDescValue}
                      onChange={(e) => setEditDescValue(e.target.value)}
                      className="w-full rounded-lg border border-zinc-250 bg-white px-2.5 py-1.5 text-[11px] text-zinc-500 focus-visible:border-blue-500 focus-visible:outline-none"
                      placeholder="Description..."
                    />
                    <div className="mt-1 flex justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={handleCancelEdit}
                        className="cursor-pointer rounded bg-zinc-200 p-1 text-zinc-650 hover:bg-zinc-300"
                        title="Cancel"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="submit"
                        disabled={editMutation.isPending}
                        className="cursor-pointer rounded bg-blue-600 p-1 text-white hover:bg-blue-750"
                        title="Save"
                      >
                        <Check className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => selectList(list.name)}
                      className={`flex w-full cursor-pointer flex-col rounded-xl border p-3.5 text-left transition-all ${
                        isActive
                          ? "border-blue-200 bg-blue-50/50 font-semibold text-blue-750"
                          : list.status === "disabled"
                            ? "border-zinc-200 bg-zinc-50/60 text-zinc-500 opacity-80 hover:border-zinc-300"
                            : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-350 hover:bg-zinc-50/50"
                      }`}
                    >
                      <div className="flex flex-wrap items-center gap-2 pr-12">
                        <span
                          className={`font-bold text-sm ${isActive ? "text-blue-600" : list.status === "disabled" ? "text-zinc-500" : "text-zinc-800"}`}
                        >
                          {list.name}
                        </span>
                        {list.status === "disabled" && (
                          <span className="rounded-md border border-amber-200 bg-amber-50 px-1.5 py-0.5 font-extrabold text-[9px] text-amber-700 uppercase tracking-wider">
                            Disabled
                          </span>
                        )}
                      </div>
                      {list.description && (
                        <span className="mt-1 line-clamp-1 pr-12 text-xs text-zinc-500">
                          {list.description}
                        </span>
                      )}

                      {/* Campaign limits progress bar */}
                      <div className="mt-3 flex w-full flex-col gap-1.5 border-zinc-100 border-t pt-2.5">
                        <div className="flex items-center justify-between font-semibold text-[10px] text-zinc-400">
                          <span>Campaigns This Week</span>
                          <span>
                            {hasLimit
                              ? `${sent}/${limit} sent (${left} left)`
                              : `${sent} sent`}
                          </span>
                        </div>
                        {hasLimit && limit > 0 && (
                          <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-100">
                            <div
                              className={`h-full ${barColor} rounded-full transition-all duration-500`}
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                        )}
                      </div>
                    </button>

                    {/* Options overlay visible on hover */}
                    <div className="absolute top-3.5 right-3.5 hidden items-center gap-1 group-hover:flex">
                      <button
                        type="button"
                        onClick={(e) => handleStartEdit(e, list)}
                        className="cursor-pointer rounded border border-zinc-200 bg-zinc-50 p-1 text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
                        title="Edit List"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleDelete(e, list.name)}
                        className="cursor-pointer rounded border border-zinc-200 bg-zinc-50 p-1 text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-rose-600"
                        title="Delete List"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
