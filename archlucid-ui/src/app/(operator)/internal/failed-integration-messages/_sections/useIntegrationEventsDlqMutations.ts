"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState, type SetStateAction } from "react";
import { mergeRegistrationScopeForProxy } from "@/lib/proxy-fetch-registration-scope";
import { showError, showSuccess } from "@/lib/toast";
import {
  integrationEventsDlqBulkRetryFailedMessage,
  integrationEventsDlqCopyCurlFailedMessage,
  integrationEventsDlqRetryFailedMessage,
  integrationEventsDlqSuppressFailedMessage,
} from "@/lib/integration-events-dlq-page-copy";
import { INTERNAL_INTEGRATION_EVENTS_DLQ_PATH } from "@/lib/internal-ops-route-paths";
import {
  integrationEventsDlqConfirmHrefFromSearch,
  parseIntegrationEventsDlqBulkRetryConfirmOpenFromSearch,
  parseIntegrationEventsDlqSuppressIdFromSearch,
} from "@/lib/internal/integration-events-dlq-confirm-url";

const bulkRetryPath = "/api/proxy/v1/internal/integrations/outbox/retry-dead-letter";

type Args = { readonly canMutate: boolean; readonly reload: () => Promise<void> };

export function useIntegrationEventsDlqMutations(args: Args) {
  const router = useRouter();
  const pathname = usePathname() ?? INTERNAL_INTEGRATION_EVENTS_DLQ_PATH;
  const searchParams = useSearchParams();
  const bulkRetryConfirmParam = searchParams.get("dlqBulkRetryConfirm");
  const suppressIdParam = searchParams.get("dlqSuppressId");
  const urlBulkRetryConfirmOpen = parseIntegrationEventsDlqBulkRetryConfirmOpenFromSearch(bulkRetryConfirmParam);
  const urlSuppressOutboxId = parseIntegrationEventsDlqSuppressIdFromSearch(suppressIdParam);
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [suppressingId, setSuppressingId] = useState<string | null>(null);
  const [bulkRetrying, setBulkRetrying] = useState(false);
  const [bulkRetryDialogOpen, setBulkRetryDialogOpenState] = useState(urlBulkRetryConfirmOpen);
  const [bulkRetryAcknowledgment, setBulkRetryAcknowledgment] = useState("");
  const [suppressTargetId, setSuppressTargetIdState] = useState<string | null>(
    urlSuppressOutboxId.length > 0 ? urlSuppressOutboxId : null,
  );

  const syncConfirmToUrl = useCallback(
    (state: { bulkRetryConfirmOpen: boolean; suppressOutboxId: string | null }) => {
      router.replace(
        integrationEventsDlqConfirmHrefFromSearch(searchParams.toString(), state, pathname),
        { scroll: false },
      );
    },
    [pathname, router, searchParams],
  );

  const setBulkRetryDialogOpen = useCallback(
    (value: SetStateAction<boolean>) => {
      setBulkRetryDialogOpenState((current) => {
        const next = typeof value === "function" ? value(current) : value;
        syncConfirmToUrl({
          bulkRetryConfirmOpen: next,
          suppressOutboxId: suppressTargetId,
        });

        return next;
      });
    },
    [suppressTargetId, syncConfirmToUrl],
  );

  const setSuppressTargetId = useCallback(
    (value: SetStateAction<string | null>) => {
      setSuppressTargetIdState((current) => {
        const next = typeof value === "function" ? value(current) : value;
        syncConfirmToUrl({
          bulkRetryConfirmOpen: bulkRetryDialogOpen,
          suppressOutboxId: next,
        });

        return next;
      });
    },
    [bulkRetryDialogOpen, syncConfirmToUrl],
  );

  useEffect(() => {
    setBulkRetryDialogOpenState(
      parseIntegrationEventsDlqBulkRetryConfirmOpenFromSearch(bulkRetryConfirmParam),
    );
    const suppressId = parseIntegrationEventsDlqSuppressIdFromSearch(suppressIdParam);
    setSuppressTargetIdState(suppressId.length > 0 ? suppressId : null);
  }, [bulkRetryConfirmParam, suppressIdParam]);

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
  }, [args, setSuppressTargetId]);

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
  }, [args, setBulkRetryDialogOpen]);

  return { retryingId, suppressingId, bulkRetrying, bulkRetryDialogOpen, setBulkRetryDialogOpen, bulkRetryAcknowledgment, setBulkRetryAcknowledgment, suppressTargetId, setSuppressTargetId, copyCurl, retry, suppress, bulkRetry };
}
