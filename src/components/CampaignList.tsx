"use client";

import { useState } from "react";
import { actionGetSentMessages } from "../actions/campaigns";
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
import type { Campaign, SentMessage } from "../types/types";

interface CampaignListProps {
  initialCampaigns: Campaign[];
}

export function CampaignList({ initialCampaigns }: CampaignListProps) {
  const [campaigns] = useState<Campaign[]>(initialCampaigns);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
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

  return (
    <div className="flex flex-col gap-4">
      {campaigns.length === 0 ? (
        <div className="py-16 text-center text-zinc-500 border border-zinc-900 rounded-xl bg-zinc-950/20">
          No marketing campaigns sent yet. Use the composer to dispatch your first message.
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date Sent</TableHead>
              <TableHead>Channel</TableHead>
              <TableHead>Subject / Message</TableHead>
              <TableHead>Delivery Volume</TableHead>
              <TableHead className="text-right">Logs</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {campaigns.map((camp) => (
              <TableRow key={camp.id}>
                <TableCell className="text-xs text-zinc-400">
                  {new Date(camp.created_at).toLocaleDateString()} at{" "}
                  {new Date(camp.created_at).toLocaleTimeString()}
                </TableCell>
                <TableCell>
                  <span className="text-xs font-bold uppercase tracking-wider bg-zinc-900 px-2.5 py-1 rounded-full border border-zinc-800 text-zinc-300">
                    {camp.type === "both" ? "Email + SMS" : camp.type}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col max-w-sm truncate">
                    <span className="font-bold text-white truncate">
                      {camp.type === "sms" ? "SMS Campaign" : camp.subject}
                    </span>
                    <span className="text-xs text-zinc-400 truncate mt-0.5">
                      {camp.content}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-xs text-emerald-400 bg-emerald-950/60 border border-emerald-800/30 px-3 py-1 rounded-full font-bold">
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
            <div className="p-4 rounded-xl border border-zinc-900 bg-zinc-950/80 text-xs flex flex-col gap-2">
              <div className="grid grid-cols-2 gap-2 text-zinc-400">
                <span>Campaign Channel:</span>
                <span className="font-semibold text-white uppercase">{selectedCampaign.type}</span>
                <span>Date Dispatched:</span>
                <span className="font-semibold text-white">
                  {new Date(selectedCampaign.created_at).toLocaleString()}
                </span>
              </div>
              <div className="border-t border-zinc-900 pt-2 mt-1">
                <span className="text-zinc-400">Message Body:</span>
                <p className="mt-1 text-zinc-300 italic text-[11px] leading-relaxed whitespace-pre-wrap">
                  "{selectedCampaign.content}"
                </p>
              </div>
            </div>

            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              Subscriber Delivery Receipts
            </h3>

            {isLoadingLogs ? (
              <div className="py-8 text-center text-zinc-500 text-xs">
                Fetching recipient delivery statuses...
              </div>
            ) : deliveryLogs.length === 0 ? (
              <div className="py-8 text-center text-zinc-500 text-xs border border-zinc-900 rounded-xl">
                No individual recipient receipt logs recorded for this dispatch.
              </div>
            ) : (
              <div className="max-h-60 overflow-y-auto rounded-xl border border-zinc-900">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="sticky top-0 bg-zinc-900/90 backdrop-blur border-b border-zinc-800 text-zinc-400 uppercase font-semibold">
                    <tr>
                      <th className="p-3">Recipients</th>
                      <th className="p-3">Channel</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">AWS Message ID</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-900 bg-zinc-950/20">
                    {deliveryLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-zinc-900/10">
                        <td className="p-3 font-semibold text-zinc-200 truncate max-w-[120px]">
                          {/* Client ID fallback if joined fields are not loaded */}
                          {log.client_id.substring(0, 8)}...
                        </td>
                        <td className="p-3 uppercase text-[10px] tracking-wide text-zinc-400">
                          {log.channel}
                        </td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              log.status === "sent"
                                ? "bg-emerald-950 text-emerald-400 border border-emerald-800/20"
                                : "bg-rose-950 text-rose-400 border border-rose-800/20"
                            }`}
                          >
                            {log.status}
                          </span>
                        </td>
                        <td className="p-3 font-mono text-[10px] text-zinc-500 truncate max-w-[100px]" title={log.aws_message_id}>
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
