"use client";

import { Button } from "../../components/ui/button";
import { Dialog } from "../../components/ui/dialog";
import { Input } from "../../components/ui/input";

export function CreateMailingListModal({
  isModalOpen,
  setIsModalOpen,
  handleCreateList,
  newListName,
  setNewListName,
  newListDesc,
  setNewListDesc,
  isPending,
}: {
  isModalOpen: boolean;
  setIsModalOpen: (open: boolean) => void;
  handleCreateList: (e: React.FormEvent) => Promise<void>;
  newListName: string;
  setNewListName: (name: string) => void;
  newListDesc: string;
  setNewListDesc: (desc: string) => void;
  isPending: boolean;
}) {
  return (
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
          <label
            htmlFor="description"
            className="text-xs font-semibold uppercase tracking-wider text-zinc-500"
          >
            List Description
          </label>
          <textarea
            id="description"
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
          <Button type="submit" disabled={isPending}>
            {isPending ? "Creating on AWS..." : "Create List"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
