"use client";

import { Plus } from "lucide-react";
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
  return (
    <div className="lg:col-span-1 flex flex-col gap-4 bg-white p-5 rounded-2xl border border-zinc-200 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-500">
          AWS SES Lists
        </h2>
        <button
          type="button"
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
                type="button"
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
  );
}
