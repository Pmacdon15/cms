import { auth } from "@clerk/nextjs/server";
import { Send } from "lucide-react";
import { Suspense } from "react";
import { parseParams } from "@/utils/params";
import CampaignManager from "../../components/CampaignManager";
import { dalGetCampaigns } from "../../dal/campaigns";
import { dalGetClients } from "../../dal/clients";
import { dalGetMailingLists } from "../../dal/mailing_lists";

export default function CampaignsPage(props: PageProps<"/campaigns">) {
  const searchParamsPromise = props.searchParams;
  const clientPromise = searchParamsPromise.then((p) => parseParams(p.client));

  const campaignsPromise = clientPromise.then((clientId) =>
    dalGetCampaigns(clientId),
  );
  const mailingListsPromise = dalGetMailingLists();
  const searchPromise = searchParamsPromise.then((p) => parseParams(p.search));

  const selectedClientPromise = clientPromise.then(async (clientId) => {
    if (!clientId) return null;
    const res = await dalGetClients({ client: clientId });
    return res.match(
      (clients) => clients[0] || null,
      () => null,
    );
  });

  const hasSmsPromise = auth
    .protect()
    .then((clerkAuth) => {
      return clerkAuth.has ? clerkAuth.has({ feature: "send_sms" }) : false;
    })
    .catch(() => false);

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 p-6 md:p-8">
      {/* Title Heading */}
      <div className="flex flex-col gap-2 border-zinc-100 border-b pb-5">
        <div className="flex items-center gap-2">
          <Send className="h-5 w-5 text-blue-605" />
          <h1 className="font-extrabold text-2xl text-zinc-900 tracking-tight">
            Campaigns & SMS Compositions
          </h1>
        </div>
        <p className="text-sm text-zinc-500">
          Write newsletters and SMS updates, select your channels, and view
          detailed subscriber delivery receipts.
        </p>
      </div>

      {/* Dynamic campaign manager */}
      <Suspense>
        <CampaignManager
          campaignsPromise={campaignsPromise}
          mailingListsPromise={mailingListsPromise}
          hasSmsPromise={hasSmsPromise}
          currentSearchPromise={searchPromise}
          selectedClientPromise={selectedClientPromise}
        />
      </Suspense>
    </main>
  );
}
