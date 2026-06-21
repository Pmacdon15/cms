"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Checkbox } from "../../components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";

export function MailingListSubscribersTable({
  filteredSubscribers,
  search,
  handleToggleSubscription,
}: {
  filteredSubscribers: Array<{
    id: string;
    name: string;
    email: string;
    phone_number: string;
    status: "subscribed" | "unsubscribed";
  }>;
  search: string;
  handleToggleSubscription: (
    id: string,
    currentStatus: "subscribed" | "unsubscribed",
  ) => void;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  if (filteredSubscribers.length === 0) {
    return (
      <div className="rounded-xl border border-zinc-200 bg-white py-16 text-center text-zinc-550">
        {search
          ? "No subscribers match your filter criteria."
          : "No subscribers on this contact list yet."}
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Subscriber Name</TableHead>
          <TableHead>Contact Info</TableHead>
          <TableHead className="text-right">Mailing List Status</TableHead>
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
                  className="cursor-pointer text-left font-bold text-zinc-900 transition-colors hover:text-blue-600 hover:underline"
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
                  onChange={() => handleToggleSubscription(sub.id, sub.status)}
                  label={isSubscribed ? "Subscribed" : "Opted out"}
                  className="inline-flex cursor-pointer"
                />
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
