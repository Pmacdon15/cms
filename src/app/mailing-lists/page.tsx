import { AlertCircle, Layers } from "lucide-react";
import { MailingListManager } from "@/components/ui/MailingListManager";
import {
	dalGetMailingListSubscribers,
	dalGetMailingLists,
} from "../../dal/mailing_lists";

export const revalidate = 0; // Force dynamic server rendering

// PageProps is a built-in Next.js type that we do not redefine
export default async function MailingListsPage(props: any) {
	// Await search params in Next.js 15/16
	const searchParams = await props.searchParams;
	const selectedListName = searchParams.listName;

	// 1. Fetch all mailing lists directly from AWS SES
	const listsRes = await dalGetMailingLists();
	const lists = listsRes.isOk() ? listsRes.value : [];
	const dbError = listsRes.isErr() ? listsRes.error.message : null;

	// Determine which list is currently active
	const activeList =
		lists.find((l) => l.name === selectedListName) || lists[0] || null;

	// 2. Fetch subscribers directly from the active AWS SES Contact List
	let subscribers: Array<{
		id: string;
		name: string;
		email: string;
		phone_number: string;
		status: "subscribed" | "unsubscribed";
	}> = [];
	if (activeList) {
		const subsRes = await dalGetMailingListSubscribers(activeList.name);
		subscribers = subsRes.isOk() ? subsRes.value : [];
	}

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

			{/* Database/AWS Connection Alerts */}
			{dbError && (
				<div className="p-4 rounded-xl border border-yellow-250 bg-yellow-50/70 text-yellow-900 text-xs flex items-center gap-2">
					<AlertCircle className="w-4 h-4 text-yellow-600 flex-shrink-0" />
					<div>
						<span className="font-bold">⚠️ Connection Alert:</span> Failed to
						connect to AWS: {dbError}. Simulated fallback lists are active.
					</div>
				</div>
			)}

			{/* Mailing List Workspace Component */}
			<MailingListManager
				initialLists={lists}
				initialSubscribers={subscribers}
				activeList={activeList}
			/>
		</main>
	);
}
