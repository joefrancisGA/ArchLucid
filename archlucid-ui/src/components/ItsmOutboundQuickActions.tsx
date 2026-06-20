"use client";

import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  createItsmOutboundIssue,
  listItsmFindingCorrelations,
  type ItsmFindingCorrelationListItem,
} from "@/lib/api/itsm-outbound-api";

export type ItsmOutboundQuickActionsProps = {
  readonly findingId: string;
  readonly compact?: boolean;
};

/** TB-063: reusable Jira / ServiceNow outbound actions for finding surfaces. */
export function ItsmOutboundQuickActions({ findingId, compact = false }: ItsmOutboundQuickActionsProps) {
  const [correlations, setCorrelations] = useState<ItsmFindingCorrelationListItem[]>([]);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const reload = useCallback(async (): Promise<void> => {
    const body = await listItsmFindingCorrelations(findingId);
    setCorrelations(body.correlations ?? []);
  }, [findingId]);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        await reload();
      } catch {
        if (!cancelled) setErrorMessage("ITSM linkage unavailable.");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [reload]);

  const jiraLinked = correlations.some((c) => c.provider === "Jira");
  const serviceNowLinked = correlations.some((c) => c.provider === "ServiceNow");

  async function onCreate(provider: "Jira" | "ServiceNow"): Promise<void> {
    setBusy(true);
    setErrorMessage(null);
    setStatusMessage(null);

    try {
      const created = await createItsmOutboundIssue(findingId, provider);
      setStatusMessage(`${created.provider}: ${created.externalKey}`);
      await reload();
    } catch (e) {
      const message = e instanceof Error ? e.message : "ITSM create failed.";
      setErrorMessage(message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={compact ? "space-y-1" : "space-y-2"}>
      <div className="flex flex-wrap gap-1">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-7 text-xs"
          disabled={busy || jiraLinked}
          onClick={() => void onCreate("Jira")}
          data-testid="itsm-sync-jira"
          aria-label={jiraLinked ? "Jira issue already linked" : "Create linked Jira issue"}
        >
          {jiraLinked ? "Jira linked" : compact ? "Sync Jira" : "Create Jira issue"}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-7 text-xs"
          disabled={busy || serviceNowLinked}
          onClick={() => void onCreate("ServiceNow")}
          data-testid="itsm-sync-servicenow"
          aria-label={serviceNowLinked ? "ServiceNow incident already linked" : "Create linked ServiceNow incident"}
        >
          {serviceNowLinked ? "ServiceNow linked" : compact ? "Sync ServiceNow" : "Create ServiceNow incident"}
        </Button>
      </div>

      {!compact && correlations.length > 0 ? (
        <ul className="space-y-1 text-xs">
          {correlations.map((c) => (
            <li key={`${c.provider}-${c.externalKey}`}>
              <span className="font-medium">{c.provider}</span> · <code>{c.externalKey}</code>
              {c.externalUrl ? (
                <>
                  {" "}
                  ·{" "}
                  <a href={c.externalUrl} target="_blank" rel="noreferrer" className="text-al-accent underline">
                    Open
                  </a>
                </>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}

      {statusMessage ? <p className="text-xs text-green-700 dark:text-green-400">{statusMessage}</p> : null}
      {errorMessage ? <p className="text-xs text-red-700 dark:text-red-400">{errorMessage}</p> : null}
    </div>
  );
}
