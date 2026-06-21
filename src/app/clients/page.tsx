import { auth } from "@clerk/nextjs/server";
import { Users } from "lucide-react";
import { Suspense } from "react";
import ClientList from "@/components/ClientList";
import { parseParams } from "@/utils/params";
import { dalGetClients } from "../../dal/clients";

export default function ClientsPage(props: PageProps<"/clients">) {
  const clientsPromise = props.searchParams.then((p) =>
    dalGetClients({
      search: parseParams(p.search),
      client: parseParams(p.client),
    }),
  );
  const clientPromise = props.searchParams.then((p) => parseParams(p.client));
  const searchPromise = props.searchParams.then((p) => parseParams(p.search));
  const hasSmsPromise = auth
    .protect()
    .then((auth) => auth.has({ feature: "send_sms" }));

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 p-6 md:p-8">
      {/* Title Heading */}
      <div className="flex flex-col gap-2 border-zinc-100 border-b pb-5">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-blue-605" />
          <h1 className="font-extrabold text-2xl text-zinc-900 tracking-tight">
            Clients Directory
          </h1>
        </div>
        <p className="text-sm text-zinc-500">
          View customer details, opt-in/opt-out status for each communication
          channel, and register new contacts.
        </p>
      </div>

      {/* Dynamic client manager list */}
      <Suspense>
        <ClientList
          initialClientsPromise={clientsPromise}
          hasSmsPromise={hasSmsPromise}
          currentSearchPromise={searchPromise}
          currentClientPromise={clientPromise}
        />
      </Suspense>
    </main>
  );
}
