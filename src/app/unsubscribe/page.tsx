import { AlertCircle } from "lucide-react";
import { UnsubscribeManager } from "@/components/ui/UnsubscribeManager";
import { dalGetClientSubscriptionsById } from "../../dal/mailing_lists";

export const revalidate = 0; // Force dynamic loading

// Uses the built-in PageProps parameter signature from Next.js (no custom type definition)
export default async function UnsubscribePage(props: {
  params: Promise<unknown>;
  searchParams: Promise<unknown>;
}) {
  const searchParams = await props.searchParams;
  const idParam = searchParams.id;
  const highlightedListName = searchParams.listName;

  const id = typeof idParam === "string" ? idParam.trim() : "";

  // 1. Fetch subscriber's dynamic preferences from DB
  let preferences = null;
  let errorMsg = null;

  if (id) {
    const res = await dalGetClientSubscriptionsById(id);
    if (res.isOk()) {
      preferences = res.value;
    } else {
      errorMsg = res.error.message;
    }
  } else {
    errorMsg =
      "No subscriber reference was provided in the link. Please check your newsletter email.";
  }

  return (
    <div className="flex flex-col min-h-screen bg-background text-zinc-800 items-center justify-center p-4">
      <div className="relative z-10 w-full max-w-xl flex flex-col gap-6">
        {/* Brand Header */}
        <div className="flex items-center justify-center gap-2 group mb-2">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white font-black text-md shadow-sm">
            Ω
          </div>
          <span className="font-extrabold text-lg tracking-wider text-zinc-900">
            CMS<span className="text-blue-600 font-semibold"> Pro</span>
          </span>
        </div>

        {/* Error State box */}
        {errorMsg && (
          <div className="p-6 rounded-2xl border border-red-200 bg-red-50/50 text-red-950 text-sm flex flex-col gap-3">
            <div className="flex items-center gap-2 text-red-600 font-bold">
              <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-600" />
              <span>Preferences Retrieval Error</span>
            </div>
            <p className="text-red-900 text-xs leading-relaxed">{errorMsg}</p>
            <div className="mt-2 text-zinc-500 text-[11px]">
              If you believe this is an error, please ensure the unsubscribe
              link you clicked is complete and unmodified.
            </div>
          </div>
        )}

        {/* Interactive Preferences Manager */}
        {preferences && (
          <UnsubscribeManager
            initialPreferences={preferences}
            highlightedListName={
              typeof highlightedListName === "string"
                ? highlightedListName
                : undefined
            }
          />
        )}
      </div>
    </div>
  );
}
