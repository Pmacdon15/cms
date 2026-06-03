import { auth } from "@clerk/nextjs/server";
import { Send } from "lucide-react";
import { Suspense } from "react";
import CampaignManager from "../../components/CampaignManager";
import { dalGetCampaigns } from "../../dal/campaigns";
import { dalGetMailingLists } from "../../dal/mailing_lists";
import { parseParams } from "@/utils/params";

export const revalidate = 0; // Force dynamic server rendering

// PageProps type mock since it's not exported globally here
type PageProps<T> = {
	searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default function CampaignsPage(props: PageProps<"/campaigns">) {
	const campaignsPromise = dalGetCampaigns();
	const mailingListsPromise = dalGetMailingLists();
	const searchPromise = props.searchParams.then((p) => parseParams(p.search));
	
	const hasSmsPromise = auth()
		.then((clerkAuth) => {
			const hasClerkKeys = !!(
				process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
				process.env.CLERK_SECRET_KEY
			);
			return !hasClerkKeys || (clerkAuth.has ? clerkAuth.has({ permission: "send_sms" }) : false);
		})
		.catch(() => false);

	return (
		<main className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-8 flex flex-col gap-6">
			{/* Title Heading */}
			<div className="flex flex-col gap-2 border-b border-zinc-100 pb-5">
				<div className="flex items-center gap-2">
					<Send className="w-5 h-5 text-blue-605" />
					<h1 className="text-2xl font-extrabold text-zinc-900 tracking-tight">
						Campaigns & SMS Compositions
					</h1>
				</div>
				<p className="text-sm text-zinc-500">
					Write newsletters and SMS updates, select your channels, and view detailed subscriber delivery receipts.
				</p>
			</div>

			{/* Dynamic campaign manager */}
			<Suspense>
				<CampaignManager
					campaignsPromise={campaignsPromise}
					mailingListsPromise={mailingListsPromise}
					hasSmsPromise={hasSmsPromise}
					currentSearchPromise={searchPromise}
				/>
			</Suspense>
		</main>
	);
}
