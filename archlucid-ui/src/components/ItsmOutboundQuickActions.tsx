"use client";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  createItsmOutboundIssue,
  listItsmFindingCorrelations,
  type ItsmFindingCorrelationListItem,
} from "@/lib/api/itsm-outbound-api";
import { BUYER_DEMO_ITSM_LINKAGE_UNAVAILABLE } from "@/lib/buyer-polish-copy";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { useItsmNativeCreateEnabled } from "@/lib/use-itsm-native-create-enabled";

export type ItsmOutboundQuickActionsProps = {
  readonly findingId: string;
  readonly compact?: boolean;
};

/** TB-063: reusable Jira / ServiceNow outbound actions for finding surfaces. TB-387: create gated by native flag. */
export function ItsmOutboundQuickActions({ findingId, compact = false }: ItsmOutboundQuickActionsProps) {
  const nativeCreateEnabled = useItsmNativeCreateEnabled();
  const [correlations, setCorrelations] = useState<ItsmFindingCorrelationListItem[]>([]);
  const [correlationsLoaded, setCorrelationsLoaded] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const reload = useCallback(async (): Promise<void> => {
    const body = await listItsmFindingCorrelations(findingId);
    setCorrelations(body.correlations ?? []);
    setCorrelationsLoaded(true);
  }, [findingId]);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        await reload();
      } catch {
        if (!cancelled) {
          setCorrelationsLoaded(true);
          setErrorMessage(
            isBuyerPolishedOperatorShellEnv()
              ? BUYER_DEMO_ITSM_LINKAGE_UNAVAILABLE
              : "ITSM linkage unavailable.",
          );
        }
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

  if (correlationsLoaded && !nativeCreateEnabled && correlations.length === 0) {
    return null;
  }

  return (
    <div className={compact ? "space-y-1" : "space-y-2"}>
      {nativeCreateEnabled ? (
        <div className="flex flex-wrap gap-1">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className={cn("h-7", OPERATOR_TYPOGRAPHY.helper)}
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
            className={cn("h-7", OPERATOR_TYPOGRAPHY.helper)}
            disabled={busy || serviceNowLinked}
            onClick={() => void onCreate("ServiceNow")}
            data-testid="itsm-sync-servicenow"
            aria-label={serviceNowLinked ? "ServiceNow incident already linked" : "Create linked ServiceNow incident"}
          >
            {serviceNowLinked ? "ServiceNow linked" : compact ? "Sync ServiceNow" : "Create ServiceNow incident"}
          </Button>
        </div>
      ) : null}

      {!compact && correlations.length > 0 ? (
        <ul className={cn("space-y-1", OPERATOR_TYPOGRAPHY.helper)}>
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

      {statusMessage ? <p className={cn("text-green-700 dark:text-green-400", OPERATOR_TYPOGRAPHY.helper)}>{statusMessage}</p> : null}
      {errorMessage ? <p className={cn("text-red-700 dark:text-red-400", OPERATOR_TYPOGRAPHY.helper)}>{errorMessage}</p> : null}
    </div>
  );
}
