import { Sparkles, Mail, AlertCircle } from "lucide-react";
import { dalGetClientSubscriptionsByEmail } from "../../dal/mailing_lists";
import { UnsubscribeManager } from "./UnsubscribeManager";

export const revalidate = 0; // Force dynamic loading

// Uses the built-in PageProps parameter signature from Next.js (no custom type definition)
export default async function UnsubscribePage(props: {
  params: Promise<any>;
  searchParams: Promise<any>;
}) {
  const searchParams = await props.searchParams;
  const emailParam = searchParams.email;
  const highlightedListName = searchParams.listName;

  const email = typeof emailParam === "string" ? emailParam.trim() : "";

  // 1. Fetch subscriber's dynamic preferences from DB and AWS SES
  let preferences = null;
  let errorMsg = null;

  if (email) {
    const res = await dalGetClientSubscriptionsByEmail(email);
    if (res.isOk()) {
      preferences = res.value;
    } else {
      errorMsg = res.error.message;
    }
  } else {
    errorMsg = "No email address was provided in the link. Please check your newsletter email.";
  }

  return (
    <div className="flex flex-col min-h-screen bg-black text-zinc-150 items-center justify-center p-4">
      {/* Background glow styling */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-violet-600/10 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 w-full max-w-xl flex flex-col gap-6">
        {/* Brand Header */}
        <div className="flex items-center justify-center gap-2 group mb-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center text-white font-black text-md shadow-lg shadow-violet-500/20">
            Ω
          </div>
          <span className="font-extrabold text-lg tracking-wider text-white">
            APEX<span className="text-violet-500">CMS</span>
          </span>
        </div>

        {/* Error State box */}
        {errorMsg && (
          <div className="p-6 rounded-2xl border border-rose-500/20 bg-rose-950/20 text-rose-200 text-sm flex flex-col gap-3">
            <div className="flex items-center gap-2 text-rose-450 font-bold">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>Preferences Retrieval Error</span>
            </div>
            <p className="text-zinc-400 text-xs leading-relaxed">
              {errorMsg}
            </p>
            <div className="mt-2 text-zinc-500 text-[11px]">
              If you believe this is an error, please ensure the unsubscribe link you clicked is complete and unmodified.
            </div>
          </div>
        )}

        {/* Interactive Preferences Manager */}
        {preferences && (
          <UnsubscribeManager 
            initialPreferences={preferences}
            highlightedListName={typeof highlightedListName === "string" ? highlightedListName : undefined}
          />
        )}
      </div>
    </div>
  );
}
