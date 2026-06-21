"use client";

import type * as React from "react";
import { startTransition } from "react";
import { useUpdateClientOptInMutation } from "@/mutations/clients";
import type { Client } from "@/types/types";
import Checkbox from "./checkbox";

interface ClientOptInCheckboxProps {
  client: Client;
  channel: "email" | "sms";
  onOptimisticUpdate?: (
    action: { type: "update"; client: Client } | { type: "delete"; id: string },
  ) => void;
}

export function ClientOptInCheckbox({
  client,
  channel,
  onOptimisticUpdate,
}: ClientOptInCheckboxProps) {
  const optInMutation = useUpdateClientOptInMutation();

  const checked =
    channel === "email" ? client.opt_in_newsletter : client.opt_in_sms;

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const nextChecked = e.target.checked;
    const nextNewsletter =
      channel === "email" ? nextChecked : client.opt_in_newsletter;
    const nextSms = channel === "sms" ? nextChecked : client.opt_in_sms;

    const updatedClient = {
      ...client,
      opt_in_newsletter: nextNewsletter,
      opt_in_sms: nextSms,
    };

    startTransition(async () => {
      onOptimisticUpdate?.({ type: "update", client: updatedClient });
      await optInMutation.mutateAsync({
        id: client.id,
        optInNewsletter: nextNewsletter,
        optInSms: nextSms,
      });
    });
  };

  return (
    <Checkbox
      checked={checked}
      onChange={handleChange}
      label={checked ? "Subscribed" : "Opted out"}
    />
  );
}

export default ClientOptInCheckbox;
