import { Layers } from "lucide-react";
import { Suspense } from "react";
import { MailingListManager } from "@/components/ui/MailingListManager";
import { parseParams } from "@/utils/params";
import {
  dalGetMailingListSubscribers,
  dalGetMailingLists,
} from "../../dal/mailing_lists";

export const revalidate = 0; // Force dynamic server rendering

export default function MailingListsPage(props: PageProps<"/mailing-lists">) {
  const searchParamsPromise = props.searchParams;
  const selectedListNamePromise = searchParamsPromise.then((p) =>
    parseParams(p.listName),
  );
  const searchPromise = searchParamsPromise.then(
    (p) => parseParams(p.client) || parseParams(p.search),
  );

  const listsResPromise = dalGetMailingLists();

  const activeListPromise = Promise.all([
    listsResPromise,
    selectedListNamePromise,
  ]).then(([listsRes, listName]) => {
    const lists = listsRes.ok && listsRes.value ? listsRes.value : [];
    return lists.find((l) => l.name === listName) || lists[0] || null;
  });

  const subscribersResPromise = activeListPromise.then((activeList) => {
    if (!activeList) return { ok: true as const, value: [] };
    return dalGetMailingListSubscribers(activeList.name);
  });

  return (
    <main className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-8 flex flex-col gap-6">
      {/* Title Heading */}
      <div className="flex flex-col gap-2 border-b border-zinc-100 pb-5">
        <div className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-blue-600" />
          <h1 className="text-2xl font-extrabold text-zinc-900 tracking-tight">
            Mailing Lists Directory
          </h1>
        </div>
        <p className="text-sm text-zinc-500">
          Create email lists and fetch newsletter subscriber details and opt-in
          preferences directly from AWS SES.
        </p>
      </div>

      {/* Mailing List Workspace Component */}
      <Suspense>
        <MailingListManager
          listsResPromise={listsResPromise}
          activeListPromise={activeListPromise}
          subscribersResPromise={subscribersResPromise}
          searchPromise={searchPromise}
        />
      </Suspense>
    </main>
  );
}
