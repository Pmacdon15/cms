"use client";

import { CheckCircle, Layers, Mail, Phone, Plus, Search, X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, use, useRef } from "react";
import { Button } from "../../components/ui/button";
import { Checkbox } from "../../components/ui/checkbox";
import { Dialog } from "../../components/ui/dialog";
import { Input } from "../../components/ui/input";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "../../components/ui/table";
import {
	useCreateMailingListMutation,
	useUpdateSubscriptionStatusMutation,
} from "../../mutations/mailing_lists";
import type { MailingList } from "../../types/types";
import { useDebounce } from "../../utils/useDebounce";

function MailingListSearchBar({
	initialSearch,
	subscribers,
}: {
	initialSearch: string;
	subscribers: Array<{ id: string; name: string; email: string; phone_number: string }>;
}) {
	const router = useRouter();
	const searchParams = useSearchParams();

	const getNameForSearch = (s: string) => {
		if (!s) return "";
		const match = subscribers.find((sub) => sub.id === s);
		return match ? match.name : s;
	};

	const [inputValue, setInputValue] = useState(() => getNameForSearch(initialSearch));
	const [showDropdown, setShowDropdown] = useState(false);
	const [activeIndex, setActiveIndex] = useState(-1);
	const inputRef = useRef<HTMLInputElement>(null);
	const dropdownRef = useRef<HTMLDivElement>(null);

	const debouncedSearch = useDebounce(inputValue, 300);

	// Sync when URL changes externally
	useEffect(() => {
		const s = searchParams.get("client") || searchParams.get("search") || "";
		setInputValue(getNameForSearch(s));
	}, [searchParams, subscribers]);

	// Close dropdown when clicking outside
	useEffect(() => {
		const handleClickOutside = (e: MouseEvent) => {
			if (
				dropdownRef.current &&
				!dropdownRef.current.contains(e.target as Node) &&
				inputRef.current &&
				!inputRef.current.contains(e.target as Node)
			) {
				setShowDropdown(false);
				setActiveIndex(-1);
			}
		};
		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	const suggestions = debouncedSearch.trim()
		? subscribers.filter(
				(sub) =>
					sub.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
					sub.email.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
					sub.phone_number.includes(debouncedSearch),
			)
		: [];

	const handleSelectSubscriber = (subscriber: { id: string; name: string }) => {
		setInputValue(subscriber.name);
		setShowDropdown(false);
		setActiveIndex(-1);
		
		const params = new URLSearchParams(searchParams.toString());
		params.set("client", subscriber.id);
		params.delete("search");
		router.replace(`/mailing-lists?${params.toString()}`, { scroll: false });
	};

	const handleSearchSubmit = () => {
		setShowDropdown(false);
		setActiveIndex(-1);
		
		const params = new URLSearchParams(searchParams.toString());
		if (inputValue.trim()) {
			params.set("search", inputValue.trim());
			params.delete("client");
		} else {
			params.delete("search");
			params.delete("client");
		}
		
		if (params.toString() !== searchParams.toString()) {
			router.replace(`/mailing-lists?${params.toString()}`, { scroll: false });
		}
	};

	const handleClear = () => {
		setInputValue("");
		setShowDropdown(false);
		setActiveIndex(-1);
		inputRef.current?.focus();
		
		const params = new URLSearchParams(searchParams.toString());
		params.delete("search");
		params.delete("client");
		router.replace(`/mailing-lists?${params.toString()}`, { scroll: false });
	};

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (!showDropdown || suggestions.length === 0) {
			if (e.key === "Enter") {
				e.preventDefault();
				handleSearchSubmit();
			}
			return;
		}

		switch (e.key) {
			case "ArrowDown":
				e.preventDefault();
				setActiveIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
				break;
			case "ArrowUp":
				e.preventDefault();
				setActiveIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
				break;
			case "Enter":
				e.preventDefault();
				if (activeIndex >= 0 && activeIndex < suggestions.length) {
					handleSelectSubscriber(suggestions[activeIndex]);
				} else {
					handleSearchSubmit();
				}
				break;
			case "Escape":
				setShowDropdown(false);
				setActiveIndex(-1);
				break;
		}
	};

	const highlightMatch = (text: string, query: string) => {
		if (!query.trim()) return text;
		const idx = text.toLowerCase().indexOf(query.toLowerCase());
		if (idx === -1) return text;
		return (
			<>
				{text.slice(0, idx)}
				<span className="font-bold text-blue-600">{text.slice(idx, idx + query.length)}</span>
				{text.slice(idx + query.length)}
			</>
		);
	};

	return (
		<div className="relative w-full max-w-sm hidden sm:block">
			<div className="relative">
				<Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
				<input
					ref={inputRef}
					type="text"
					placeholder="Search subscribers..."
					value={inputValue}
					onChange={(e) => {
						setInputValue(e.target.value);
						setShowDropdown(true);
						setActiveIndex(-1);
					}}
					onFocus={() => {
						if (inputValue.trim()) setShowDropdown(true);
					}}
					onKeyDown={handleKeyDown}
					autoComplete="off"
					className="w-full h-11 rounded-xl bg-white border border-zinc-200 pl-10 pr-10 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus-visible:outline-none focus-visible:border-blue-500 focus-visible:ring-1 focus-visible:ring-blue-500 transition-all"
				/>
				{inputValue && (
					<button
						type="button"
						onClick={handleClear}
						className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition-colors cursor-pointer"
					>
						<X className="w-4 h-4" />
					</button>
				)}
			</div>

			{/* Autocomplete Dropdown */}
			{showDropdown && debouncedSearch.trim().length > 0 && (
				<div
					ref={dropdownRef}
					className="absolute z-[60] top-full left-0 mt-1.5 w-80 bg-white border border-zinc-200 rounded-xl shadow-xl shadow-zinc-200/60 overflow-hidden animate-fade-in-scale"
				>
					{suggestions.length === 0 && (
						<div className="px-4 py-5 text-center text-xs text-zinc-400">
							No subscribers found matching &ldquo;{debouncedSearch}&rdquo;
						</div>
					)}
					{suggestions.length > 0 && (
						<ul className="max-h-64 overflow-y-auto py-1">
							{suggestions.map((sub, index) => (
								<li key={sub.id}>
									<button
										type="button"
										onClick={() => handleSelectSubscriber(sub)}
										onMouseEnter={() => setActiveIndex(index)}
										className={`w-full text-left px-3.5 py-2.5 flex items-start gap-2.5 transition-colors cursor-pointer ${
											activeIndex === index ? "bg-blue-50/80" : "hover:bg-zinc-50"
										}`}
									>
										{/* Avatar */}
										<div className="w-8 h-8 mt-0.5 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-[10px] flex-shrink-0 shadow-sm">
											{sub.name
												.split(" ")
												.map((w) => w[0])
												.join("")
												.slice(0, 2)
												.toUpperCase()}
										</div>
										{/* Info */}
										<div className="flex flex-col gap-0.5 min-w-0 flex-1">
											<span className="text-xs font-semibold text-zinc-900 truncate">
												{highlightMatch(sub.name, debouncedSearch)}
											</span>
											<div className="flex items-center gap-2.5 text-[11px] text-zinc-500">
												<span className="flex items-center gap-1 truncate">
													<Mail className="w-2.5 h-2.5 flex-shrink-0" />
													{highlightMatch(sub.email, debouncedSearch)}
												</span>
												<span className="flex items-center gap-1 truncate">
													<Phone className="w-2.5 h-2.5 flex-shrink-0" />
													{highlightMatch(sub.phone_number, debouncedSearch)}
												</span>
											</div>
										</div>
									</button>
								</li>
							))}
							<li className="px-3.5 py-2 border-t border-zinc-100 flex items-center justify-between">
								<span className="text-[10px] text-zinc-400">
									{suggestions.length} result{suggestions.length !== 1 ? "s" : ""}
								</span>
								<span className="text-[10px] text-zinc-400">
									<kbd className="px-1 py-0.5 bg-zinc-100 border border-zinc-200 rounded text-[9px] font-mono">
										↵
									</kbd>{" "}
									search all ·{" "}
									<kbd className="px-1 py-0.5 bg-zinc-100 border border-zinc-200 rounded text-[9px] font-mono">
										↑↓
									</kbd>{" "}
									navigate
								</span>
							</li>
						</ul>
					)}
				</div>
			)}
		</div>
	);
}

interface MailingListManagerProps {
	listsResPromise: Promise<{ ok: boolean; value?: MailingList[]; error?: any }>;
	activeListPromise: Promise<MailingList | null>;
	subscribersResPromise: Promise<{ ok: boolean; value?: any[]; error?: any }>;
	searchPromise: Promise<string>;
}

export function MailingListManager({
	listsResPromise,
	activeListPromise,
	subscribersResPromise,
	searchPromise,
}: MailingListManagerProps) {
	const router = useRouter();
	const searchParams = useSearchParams();

	const listsRes = use(listsResPromise);
	const lists = listsRes.ok && listsRes.value ? listsRes.value : [];

	const activeList = use(activeListPromise);

	const subscribersRes = use(subscribersResPromise);
	const initialSubscribers = subscribersRes.ok && subscribersRes.value ? subscribersRes.value : [];
	const search = use(searchPromise) || "";

	const [subscribers, setSubscribers] = useState(initialSubscribers);
	const [isModalOpen, setIsModalOpen] = useState(false);

	const [newListName, setNewListName] = useState("");
	const [newListDesc, setNewListDesc] = useState("");

	useEffect(() => {
		setSubscribers(initialSubscribers);
	}, [initialSubscribers]);

	const createListMutation = useCreateMailingListMutation(() => {
		setIsModalOpen(false);
		setNewListName("");
		setNewListDesc("");
		router.refresh();
	});

	const toggleSubscriptionMutation = useUpdateSubscriptionStatusMutation();

	const handleCreateList = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!newListName.trim()) return;
		await createListMutation.mutateAsync({
			name: newListName,
			description: newListDesc,
		});
	};

	const handleToggleSubscription = async (
		id: string,
		currentStatus: "subscribed" | "unsubscribed",
	) => {
		if (!activeList) return;

		const nextStatus = currentStatus === "subscribed" ? "unsubscribed" : "subscribed";

		setSubscribers((prev) =>
			prev.map((sub) => (sub.id === id ? { ...sub, status: nextStatus } : sub)),
		);

		const result = await toggleSubscriptionMutation.mutateAsync({
			clientIdOrEmail: id,
			listName: activeList.name,
			status: nextStatus,
			isPublic: false,
		});

		if (result.ok) {
			router.refresh();
		} else {
			setSubscribers(initialSubscribers);
		}
	};

	const selectList = (listName: string) => {
		const params = new URLSearchParams(searchParams.toString());
		params.set("listName", listName);
		router.push(`/mailing-lists?${params.toString()}`);
	};

	const filteredSubscribers = subscribers.filter(
		(sub) =>
			sub.id === search ||
			sub.name.toLowerCase().includes(search.toLowerCase()) ||
			sub.email.toLowerCase().includes(search.toLowerCase()) ||
			sub.phone_number.includes(search),
	);

	return (
		<div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
			{/* 1. Sidebar - List Navigator */}
			<div className="lg:col-span-1 flex flex-col gap-4 bg-white p-5 rounded-2xl border border-zinc-200 shadow-sm">
				<div className="flex items-center justify-between">
					<h2 className="text-xs font-bold uppercase tracking-wider text-zinc-500">
						AWS SES Lists
					</h2>
					<button
						onClick={() => setIsModalOpen(true)}
						className="p-1 rounded-lg bg-zinc-50 border border-zinc-200 hover:bg-zinc-100 text-blue-600 transition-colors cursor-pointer"
						title="Create new list on AWS"
					>
						<Plus className="w-4 h-4" />
					</button>
				</div>

				{lists.length === 0 ? (
					<div className="text-center py-8 text-xs text-zinc-500">
						No contact lists found on AWS SES.
					</div>
				) : (
					<div className="flex flex-col gap-1.5 max-h-[400px] overflow-y-auto pr-1">
						{lists.map((list) => {
							const isActive = activeList?.name === list.name;
							return (
								<button
									key={list.name}
									onClick={() => selectList(list.name)}
									className={`flex flex-col text-left p-3.5 rounded-xl border transition-all cursor-pointer ${
										isActive
											? "bg-blue-50/50 border-blue-200 text-blue-750 font-semibold"
											: "bg-white border-zinc-200 text-zinc-600 hover:border-zinc-350 hover:bg-zinc-50/50"
									}`}
								>
									<span
										className={`text-sm font-bold ${isActive ? "text-blue-600" : "text-zinc-800"}`}
									>
										{list.name}
									</span>
									{list.description && (
										<span className="text-xs text-zinc-500 mt-1 line-clamp-1">
											{list.description}
										</span>
									)}
								</button>
							);
						})}
					</div>
				)}
			</div>

			{/* 2. Main Workspace - Client list mapper */}
			<div className="lg:col-span-3 flex flex-col gap-5">
				{!activeList ? (
					<div className="py-24 text-center border border-dashed border-zinc-200 rounded-2xl text-zinc-450 flex flex-col items-center gap-3">
						<Mail className="w-8 h-8 text-zinc-400" />
						<span className="text-sm font-semibold">
							Select or Create an AWS SES Contact List to Manage Subscribers
						</span>
					</div>
				) : (
					<div className="flex flex-col gap-5">
						{/* Header info */}
						<div className="bg-white p-5 rounded-2xl border border-zinc-200 flex flex-col sm:flex-row justify-between items-center gap-4 shadow-sm shadow-zinc-100/50">
							<div>
								<h3 className="text-md font-bold text-zinc-900 flex items-center gap-2">
									<CheckCircle className="w-4 h-4 text-blue-600" />{" "}
									{activeList.name}
								</h3>
								<p className="text-xs text-zinc-550 mt-1">
									{activeList.description ||
										"Active contact list deployed on AWS SES."}
								</p>
							</div>
							<div className="flex flex-col sm:flex-row items-center gap-4">
								<MailingListSearchBar initialSearch={search} subscribers={subscribers} />
								<span className="text-xs font-semibold uppercase bg-zinc-550/10 text-blue-650 border border-blue-200/50 px-3 py-1.5 rounded-full flex-shrink-0">
									{subscribers.filter((s) => s.status === "subscribed").length}{" "}
									Active
								</span>
							</div>
						</div>

						{/* Subscribers Table */}
						{filteredSubscribers.length === 0 ? (
							<div className="py-16 text-center border border-zinc-200 rounded-xl bg-white text-zinc-550">
								{search
									? "No subscribers match your filter criteria."
									: "No subscribers on this contact list yet."}
							</div>
						) : (
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Subscriber Name</TableHead>
										<TableHead>Contact Info</TableHead>
										<TableHead className="text-right">
											Mailing List Status
										</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{filteredSubscribers.map((sub) => {
										const isSubscribed = sub.status === "subscribed";
										return (
											<TableRow key={sub.id}>
												<TableCell>
													<button
														type="button"
														onClick={() => {
															const params = new URLSearchParams(searchParams.toString());
															params.set("client", sub.id);
															params.delete("search"); // Clear search when focusing on a client
															router.push(`/mailing-lists?${params.toString()}`);
														}}
														className="font-bold text-zinc-900 hover:text-blue-600 hover:underline transition-colors cursor-pointer text-left"
													>
														{sub.name}
													</button>
												</TableCell>
												<TableCell>
													<div className="flex flex-col text-xs text-zinc-500">
														<span>{sub.email}</span>
														<span>{sub.phone_number}</span>
													</div>
												</TableCell>
												<TableCell className="text-right">
													<Checkbox
														checked={isSubscribed}
														onChange={() =>
															handleToggleSubscription(sub.id, sub.status)
														}
														label={isSubscribed ? "Subscribed" : "Opted out"}
														className="inline-flex cursor-pointer"
													/>
												</TableCell>
											</TableRow>
										);
									})}
								</TableBody>
							</Table>
						)}
					</div>
				)}
			</div>

			{/* Create List Modal Dialog */}
			<Dialog
				isOpen={isModalOpen}
				onClose={() => setIsModalOpen(false)}
				title="Create SES Contact List"
			>
				<form onSubmit={handleCreateList} className="flex flex-col gap-4">
					<Input
						label="SES Contact List Name"
						placeholder="e.g. TanStackFormNewsletter, WeeklyDigestPro"
						value={newListName}
						onChange={(e) => setNewListName(e.target.value)}
						required
					/>
					<div className="flex flex-col gap-1.5">
						<label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
							List Description
						</label>
						<textarea
							placeholder="Provide context about what marketing messages this list will receive..."
							rows={4}
							value={newListDesc}
							onChange={(e) => setNewListDesc(e.target.value)}
							className="flex w-full rounded-xl bg-white border border-zinc-200 px-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus-visible:outline-none focus-visible:border-blue-500 focus-visible:ring-1 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200"
						/>
					</div>
					<div className="flex justify-end pt-2 gap-3">
						<Button
							type="button"
							variant="secondary"
							onClick={() => setIsModalOpen(false)}
						>
							Cancel
						</Button>
						<Button type="submit" disabled={createListMutation.isPending}>
							{createListMutation.isPending
								? "Creating on AWS..."
								: "Create List"}
						</Button>
					</div>
				</form>
			</Dialog>
		</div>
	);
}

export default MailingListManager;
