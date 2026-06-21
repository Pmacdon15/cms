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
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4 text-zinc-800">
      <div className="relative z-10 flex w-full max-w-xl flex-col gap-6">
        {/* Brand Header */}
        <div className="group mb-2 flex items-center justify-center gap-2">
          <Logo className="h-9 w-9" />
          <span className="font-display font-extrabold text-lg text-zinc-900 tracking-wider">
            CMS<span className="font-semibold text-blue-600"> Pro</span>
          </span>
        </div>

        <Suspense
          fallback={
            <div className="py-4 text-center text-xs text-zinc-500">
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
