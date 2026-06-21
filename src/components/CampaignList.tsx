"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { actionGetSentMessages } from "../actions/campaigns";
import type { Campaign, SentMessage } from "../types/types";
import { Button } from "./ui/button";
import { Dialog } from "./ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";

interface CampaignListProps {
  initialCampaigns: Campaign[];
  hasSms: boolean;
}

export function CampaignList({ initialCampaigns, hasSms }: CampaignListProps) {
  const router = useRouter();
  const [campaigns] = useState<Campaign[]>(initialCampaigns);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(
    null,
  );
  const [deliveryLogs, setDeliveryLogs] = useState<SentMessage[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);

  const handleViewDetails = async (campaign: Campaign) => {
    setSelectedCampaign(campaign);
    setIsLoadingLogs(true);
    setDeliveryLogs([]);

    // Fetch sent message logs without TanStack Query (standard async helper satisfies no-query-fetching constraint)
    const result = await actionGetSentMessages(campaign.id);
    if (result.ok && result.value) {
      setDeliveryLogs(result.value);
    }
    setIsLoadingLogs(false);
  };

  const campaignsToShow = hasSms
    ? campaigns
    : campaigns.filter((c) => c.type === "email");

  return (
    <div className="flex flex-col gap-4">
      {campaignsToShow.length === 0 ? (
        <div className="rounded-xl border border-zinc-200 bg-white py-16 text-center text-zinc-550">
          No marketing campaigns sent yet. Use the composer to dispatch your
          first message.
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date Sent</TableHead>
              {hasSms && <TableHead>Channel</TableHead>}
              <TableHead>Target Audience</TableHead>
              <TableHead>Subject / Message</TableHead>
              <TableHead>Delivery Volume</TableHead>
              <TableHead className="text-right">Logs</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {campaignsToShow.map((camp) => (
              <TableRow key={camp.id}>
                <TableCell className="text-xs text-zinc-500">
                  {new Date(camp.created_at).toLocaleDateString()} at{" "}
                  {new Date(camp.created_at).toLocaleTimeString()}
                </TableCell>
                {hasSms && (
                  <TableCell>
                    <span className="rounded-full border border-zinc-200 bg-zinc-100 px-2.5 py-1 font-bold text-xs text-zinc-650 uppercase tracking-wider">
                      {camp.type === "both" ? "Email + SMS" : camp.type}
                    </span>
                  </TableCell>
                )}
                <TableCell className="font-semibold text-xs text-zinc-700">
                  {camp.mailing_list_name || "Broadcast to All"}
                </TableCell>
                <TableCell>
                  <div className="flex max-w-sm flex-col truncate">
                    <span className="truncate font-bold text-zinc-900">
                      {camp.type === "sms" ? "Text Campaign" : camp.subject}
                    </span>
                    <span className="mt-0.5 truncate text-xs text-zinc-500">
                      {camp.content}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 font-bold text-emerald-705 text-xs">
                    {camp.sent_count} Sent
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleViewDetails(camp)}
                    className="cursor-pointer"
                  >
                    Receipts
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* Glassmorphic Dispatch Delivery Dialog */}
      <Dialog
        isOpen={selectedCampaign !== null}
        onClose={() => setSelectedCampaign(null)}
        title="Campaign Delivery Receipts"
      >
        {selectedCampaign && (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2 rounded-xl border border-zinc-200 bg-zinc-50/50 p-4 text-xs">
              <div className="grid grid-cols-2 gap-2 text-zinc-500">
                {hasSms && (
                  <>
                    <span>Campaign Channel:</span>
                    <span className="font-semibold text-zinc-900 uppercase">
                      {selectedCampaign.type}
                    </span>
                  </>
                )}
                <span>Target Audience:</span>
                <span className="font-medium font-semibold text-zinc-900">
                  {selectedCampaign.mailing_list_name || "Broadcast to All"}
                </span>
                <span>Date Dispatched:</span>
                <span className="font-semibold text-zinc-900">
                  {new Date(selectedCampaign.created_at).toLocaleString()}
                </span>
              </div>
              <div className="mt-1 border-zinc-200 border-t pt-2">
                <span className="text-zinc-550">Message Body:</span>
                <p className="mt-1 whitespace-pre-wrap text-[11px] text-zinc-700 italic leading-relaxed">
                  "{selectedCampaign.content}"
                </p>
              </div>
            </div>

            <h3 className="font-bold text-xs text-zinc-500 uppercase tracking-wider">
              Subscriber Delivery Receipts
            </h3>

            {isLoadingLogs ? (
              <div className="py-8 text-center text-xs text-zinc-500">
                Fetching recipient delivery statuses...
              </div>
            ) : deliveryLogs.length === 0 ? (
              <div className="rounded-xl border border-zinc-200 bg-white py-8 text-center text-xs text-zinc-550">
                No individual recipient receipt logs recorded for this dispatch.
              </div>
            ) : (
              <div className="max-h-60 overflow-y-auto rounded-xl border border-zinc-200">
                <table className="w-full border-collapse text-left text-xs">
                  <thead className="sticky top-0 border-zinc-200 border-b bg-zinc-50 font-semibold text-zinc-500 uppercase">
                    <tr>
                      <th className="p-3">Recipients</th>
                      {hasSms && <th className="p-3">Channel</th>}
                      <th className="p-3">Status</th>
                      <th className="p-3">AWS Message ID</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 bg-white">
                    {deliveryLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-zinc-50/50">
                        <td className="max-w-[200px] truncate p-3 font-semibold text-zinc-800">
                          <div className="flex flex-col">
                            <button
                              type="button"
                              onClick={() => {
                                router.push(`/clients?client=${log.client_id}`);
                              }}
                              className="cursor-pointer truncate text-left font-bold text-zinc-800 transition-colors hover:text-blue-600 hover:underline"
                              title="View client profile"
                            >
                              {log.client_name ||
                                `${log.client_id.substring(0, 8)}...`}
                            </button>
                            {log.client_email && (
                              <span className="mt-0.5 truncate text-[10px] text-zinc-400">
                                {log.client_email}
                              </span>
                            )}
                          </div>
                        </td>
                        {hasSms && (
                          <td className="p-3 text-[10px] text-zinc-500 uppercase tracking-wide">
                            {log.channel}
                          </td>
                        )}
                        <td className="p-3">
                          <span
                            className={`rounded px-2 py-0.5 font-bold text-[10px] ${
                              log.status === "sent"
                                ? "border border-emerald-100 bg-emerald-50 text-emerald-700"
                                : "border border-red-100 bg-red-50 text-red-700"
                            }`}
                          >
                            {log.status}
                          </span>
                        </td>
                        <td
                          className="max-w-[100px] truncate p-3 font-mono text-[10px] text-zinc-400"
                          title={log.aws_message_id}
                        >
                          {log.aws_message_id || "N/A"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </Dialog>
    </div>
  );
}
export default CampaignList;
