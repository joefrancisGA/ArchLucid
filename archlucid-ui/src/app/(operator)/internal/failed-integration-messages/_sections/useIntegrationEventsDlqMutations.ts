"use client";

import { useCallback, useState } from "react";
import { mergeRegistrationScopeForProxy } from "@/lib/proxy-fetch-registration-scope";
import { showError, showSuccess } from "@/lib/toast";
import {
  integrationEventsDlqBulkRetryFailedMessage,
  integrationEventsDlqCopyCurlFailedMessage,
  integrationEventsDlqRetryFailedMessage,
  integrationEventsDlqSuppressFailedMessage,
} from "@/lib/integration-events-dlq-page-copy";

const bulkRetryPath = "/api/proxy/v1/internal/integrations/outbox/retry-dead-letter";

type Args = { readonly canMutate: boolean; readonly reload: () => Promise<void> };

export function useIntegrationEventsDlqMutations(args: Args) {
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [suppressingId, setSuppressingId] = useState<string | null>(null);
  const [bulkRetrying, setBulkRetrying] = useState(false);
  const [bulkRetryDialogOpen, setBulkRetryDialogOpen] = useState(false);
  const [bulkRetryAcknowledgment, setBulkRetryAcknowledgment] = useState("");
  const [suppressTargetId, setSuppressTargetId] = useState<string | null>(null);

  const copyCurl = useCallback(async (outboxId: string) => {
    try {
      const response = await fetch(
        `/api/proxy/v1/admin/integration-outbox/dead-letters/${encodeURIComponent(outboxId)}/curl`,
        mergeRegistrationScopeForProxy({ headers: { Accept: "application/json" }, cache: "no-store" }),
      );
      if (!response.ok) { showError("Copy as cURL failed", integrationEventsDlqCopyCurlFailedMessage()); return; }
      const body = (await response.json()) as { curlCommand?: string };
      if (!body.curlCommand) { showError("Copy as cURL failed", integrationEventsDlqCopyCurlFailedMessage()); return; }
      await navigator.clipboard.writeText(body.curlCommand);
      showSuccess("cURL command copied to clipboard.");
    } catch (error: unknown) {
      showError("Copy as cURL failed", error instanceof Error ? error.message : integrationEventsDlqCopyCurlFailedMessage());
    }
  }, []);

  const retry = useCallback(async (outboxId: string) => {
    if (!args.canMutate) return;
    setRetryingId(outboxId);
    try {
      const response = await fetch(
        `/api/proxy/v1/admin/integration-outbox/dead-letters/${encodeURIComponent(outboxId)}/retry`,
        mergeRegistrationScopeForProxy({ method: "POST" }),
      );
      if (!response.ok) { showError("Retry failed", integrationEventsDlqRetryFailedMessage()); return; }
      showSuccess("Failed message queued for retry.");
      await args.reload();
    } finally { setRetryingId(null); }
  }, [args]);

  const suppress = useCallback(async (outboxId: string) => {
    if (!args.canMutate) return;
    setSuppressingId(outboxId);
    try {
      const response = await fetch(
        `/api/proxy/v1/admin/integration-outbox/dead-letters/${encodeURIComponent(outboxId)}/suppress`,
        mergeRegistrationScopeForProxy({ method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify({}) }),
      );
      if (!response.ok) { showError("Suppress failed", integrationEventsDlqSuppressFailedMessage()); return; }
      showSuccess("Failed message suppressed.");
      await args.reload();
    } finally { setSuppressingId(null); setSuppressTargetId(null); }
  }, [args]);

  const bulkRetry = useCallback(async () => {
    if (!args.canMutate) return;
    setBulkRetrying(true);
    try {
      const response = await fetch(bulkRetryPath, mergeRegistrationScopeForProxy({ method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify({ maxRows: 100 }) }));
      if (!response.ok) { showError("Bulk retry failed", integrationEventsDlqBulkRetryFailedMessage()); return; }
      const body = (await response.json()) as { retriedCount?: number };
      const count = body.retriedCount ?? 0;
      showSuccess(count > 0 ? `Queued ${count} failed message(s) for retry.` : "No failed messages matched.");
      setBulkRetryDialogOpen(false); setBulkRetryAcknowledgment("");
      await args.reload();
    } catch (error: unknown) {
      showError("Bulk retry failed", error instanceof Error ? error.message : integrationEventsDlqBulkRetryFailedMessage());
    } finally { setBulkRetrying(false); }
  }, [args]);

  return { retryingId, suppressingId, bulkRetrying, bulkRetryDialogOpen, setBulkRetryDialogOpen, bulkRetryAcknowledgment, setBulkRetryAcknowledgment, suppressTargetId, setSuppressTargetId, copyCurl, retry, suppress, bulkRetry };
}
