import { auth } from "@clerk/nextjs/server";
import { Users } from "lucide-react";
import { Suspense } from "react";
import ClientList from "@/components/ClientList";
import { dalGetClients } from "../../dal/clients";

export const revalidate = 0; // Force dynamic server rendering

function parseParams(p: string | string[] | undefined): string {
	return Array.isArray(p) ? (p[0] ?? "") : (p ?? "");
}

export default async function ClientsPage(props: PageProps<"/clients">) {
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
		.then((auth) => auth.has({ permission: "send_sms" }));

	return (
		<main className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-8 flex flex-col gap-6">
			{/* Title Heading */}
			<div className="flex flex-col gap-2 border-b border-zinc-100 pb-5">
				<div className="flex items-center gap-2">
					<Users className="w-5 h-5 text-blue-605" />
					<h1 className="text-2xl font-extrabold text-zinc-900 tracking-tight">
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
