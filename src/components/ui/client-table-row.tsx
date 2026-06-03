"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
	useDeleteClientMutation,
	useUpdateClientOptInMutation,
} from "@/mutations/clients";
import type { Client } from "@/types/types";
import Checkbox from "./checkbox";
import { TableCell, TableRow } from "./table";

interface ClientTableRowProps {
	client: Client;
	hasSms: boolean;
	onSelectClient: (client: Client) => void;
}

export function ClientTableRow({
	client,
	hasSms,
	onSelectClient,
}: ClientTableRowProps) {
	const router = useRouter();
	const deleteMutation = useDeleteClientMutation();
	const optInMutation = useUpdateClientOptInMutation();

	const [optInNewsletter, setOptInNewsletter] = useState(
		client.opt_in_newsletter,
	);
	const [optInSms, setOptInSms] = useState(client.opt_in_sms);

	const handleOptInToggle = async (
		channel: "email" | "sms",
		checked: boolean,
	) => {
		const nextNewsletter = channel === "email" ? checked : optInNewsletter;
		const nextSms = channel === "sms" ? checked : optInSms;

		if (channel === "email") setOptInNewsletter(checked);
		if (channel === "sms") setOptInSms(checked);

		const result = await optInMutation.mutateAsync({
			id: client.id,
			optInNewsletter: nextNewsletter,
			optInSms: nextSms,
		});

		if (result.ok) {
			router.refresh();
		} else {
			if (channel === "email") setOptInNewsletter(!checked);
			if (channel === "sms") setOptInSms(!checked);
		}
	};

	const handleDelete = async () => {
		if (!confirm("Are you sure you want to remove this client?")) return;
		const result = await deleteMutation.mutateAsync(client.id);
		if (result.ok) {
			router.refresh();
		}
	};

	return (
		<TableRow
			className="cursor-pointer hover:bg-blue-50/40 transition-colors"
			onClick={() => onSelectClient(client)}
		>
			<TableCell className="font-bold text-zinc-900">{client.name}</TableCell>
			<TableCell>
				<div className="flex flex-col text-xs gap-0.5 text-zinc-500">
					<span>{client.email}</span>
					<span>{client.phone_number}</span>
				</div>
			</TableCell>
			<TableCell>
				<Checkbox
					checked={optInNewsletter}
					onChange={(e) => {
						e.stopPropagation();
						handleOptInToggle("email", e.target.checked);
					}}
					label={optInNewsletter ? "Subscribed" : "Opted out"}
				/>
			</TableCell>
			{hasSms && (
				<TableCell>
					<Checkbox
						checked={optInSms}
						onChange={(e) => {
							e.stopPropagation();
							handleOptInToggle("sms", e.target.checked);
						}}
						label={optInSms ? "Subscribed" : "Opted out"}
					/>
				</TableCell>
			)}
			<TableCell className="text-right">
				<button
					onClick={(e) => {
						e.stopPropagation();
						handleDelete();
					}}
					className="text-xs font-semibold text-rose-500 hover:text-rose-400 hover:underline cursor-pointer border-none bg-transparent"
					type="button"
					disabled={deleteMutation.isPending}
				>
					{deleteMutation.isPending ? "Removing..." : "Delete"}
				</button>
			</TableCell>
		</TableRow>
	);
}
