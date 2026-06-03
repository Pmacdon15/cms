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
        <div className="py-16 text-center text-zinc-550 border border-zinc-200 rounded-xl bg-white">
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
                    <span className="text-xs font-bold uppercase tracking-wider bg-zinc-100 px-2.5 py-1 rounded-full border border-zinc-200 text-zinc-650">
                      {camp.type === "both" ? "Email + SMS" : camp.type}
                    </span>
                  </TableCell>
                )}
                <TableCell className="text-xs font-semibold text-zinc-700">
                  {camp.mailing_list_name || "Broadcast to All"}
                </TableCell>
                <TableCell>
                  <div className="flex flex-col max-w-sm truncate">
                    <span className="font-bold text-zinc-900 truncate">
                      {camp.type === "sms" ? "Text Campaign" : camp.subject}
                    </span>
                    <span className="text-xs text-zinc-500 truncate mt-0.5">
                      {camp.content}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-xs text-emerald-705 bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-full font-bold">
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
            <div className="p-4 rounded-xl border border-zinc-200 bg-zinc-50/50 text-xs flex flex-col gap-2">
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
                <span className="font-semibold text-zinc-900 font-medium">
                  {selectedCampaign.mailing_list_name || "Broadcast to All"}
                </span>
                <span>Date Dispatched:</span>
                <span className="font-semibold text-zinc-900">
                  {new Date(selectedCampaign.created_at).toLocaleString()}
                </span>
              </div>
              <div className="border-t border-zinc-200 pt-2 mt-1">
                <span className="text-zinc-550">Message Body:</span>
                <p className="mt-1 text-zinc-700 italic text-[11px] leading-relaxed whitespace-pre-wrap">
                  "{selectedCampaign.content}"
                </p>
              </div>
            </div>

            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500">
              Subscriber Delivery Receipts
            </h3>

            {isLoadingLogs ? (
              <div className="py-8 text-center text-zinc-500 text-xs">
                Fetching recipient delivery statuses...
              </div>
            ) : deliveryLogs.length === 0 ? (
              <div className="py-8 text-center text-zinc-550 border border-zinc-200 rounded-xl bg-white text-xs">
                No individual recipient receipt logs recorded for this dispatch.
              </div>
            ) : (
              <div className="max-h-60 overflow-y-auto rounded-xl border border-zinc-200">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="sticky top-0 bg-zinc-50 border-b border-zinc-200 text-zinc-500 uppercase font-semibold">
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
                        <td className="p-3 font-semibold text-zinc-800 truncate max-w-[200px]">
                          <div className="flex flex-col">
                            <button
                              type="button"
                              onClick={() => {
                                router.push(`/clients?client=${log.client_id}`);
                              }}
                              className="font-bold text-zinc-800 hover:text-blue-600 hover:underline transition-colors cursor-pointer text-left truncate"
                              title="View client profile"
                            >
                              {log.client_name ||
                                `${log.client_id.substring(0, 8)}...`}
                            </button>
                            {log.client_email && (
                              <span className="text-[10px] text-zinc-400 truncate mt-0.5">
                                {log.client_email}
                              </span>
                            )}
                          </div>
                        </td>
                        {hasSms && (
                          <td className="p-3 uppercase text-[10px] tracking-wide text-zinc-500">
                            {log.channel}
                          </td>
                        )}
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              log.status === "sent"
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                                : "bg-red-50 text-red-700 border border-red-100"
                            }`}
                          >
                            {log.status}
                          </span>
                        </td>
                        <td
                          className="p-3 font-mono text-[10px] text-zinc-400 truncate max-w-[100px]"
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
