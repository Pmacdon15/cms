import { Suspense } from "react";
import Logo from "@/components/Logo";
import { UnsubscribeManager } from "@/components/ui/UnsubscribeManager";
import { dalGetClientSubscriptionsById } from "../../dal/mailing_lists";

export default function UnsubscribePage(props: PageProps<"/unsubscribe">) {
  const highlightedListNamePromise = props.searchParams.then((sp) =>
    typeof sp.listName === "string" ? sp.listName : undefined,
  );

  const preferencesPromise = props.searchParams.then((p) =>
    dalGetClientSubscriptionsById(Array.isArray(p.id) ? p.id[0] : (p.id ?? "")),
  );

  return (
    <div className="flex flex-col min-h-screen bg-background text-zinc-800 items-center justify-center p-4">
      <div className="relative z-10 w-full max-w-xl flex flex-col gap-6">
        {/* Brand Header */}
        <div className="flex items-center justify-center gap-2 group mb-2">
          <Logo className="w-9 h-9" />
          <span className="font-extrabold text-lg tracking-wider text-zinc-900 font-display">
            CMS<span className="text-blue-600 font-semibold"> Pro</span>
          </span>
        </div>

        <Suspense
          fallback={
            <div className="text-center text-zinc-500 text-xs py-4">
              Loading subscriber preferences...
            </div>
          }
        >
          <UnsubscribeManager
            preferencesPromise={preferencesPromise}
            highlightedListNamePromise={highlightedListNamePromise}
          />
        </Suspense>
      </div>
    </div>
  );
}
