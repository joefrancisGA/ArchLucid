"use client";
import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import { useCallback, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  createItsmOutboundIssue,
  type ItsmFindingCorrelationListItem,
} from "@/lib/api/itsm-outbound-api";
import { BUYER_DEMO_ITSM_LINKAGE_UNAVAILABLE } from "@/lib/buyer-polish-copy";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { invalidateItsmFindingCorrelations } from "@/lib/itsm-finding-correlations-store";
import { useItsmNativeCreateEnabled } from "@/lib/use-itsm-native-create-enabled";
import { useItsmFindingCorrelations } from "@/lib/use-itsm-finding-correlations";

export type ItsmOutboundQuickActionsProps = {
  readonly findingId: string;
  readonly compact?: boolean;
  /** When false, correlation lookup is deferred until integrations UI is opened. */
  readonly loadWhen?: boolean;
};

/** TB-063: reusable Jira / ServiceNow outbound actions for finding surfaces. TB-387: create gated by native flag. */
export function ItsmOutboundQuickActions({
  findingId,
  compact = false,
  loadWhen = true,
}: ItsmOutboundQuickActionsProps) {
  const nativeCreateEnabled = useItsmNativeCreateEnabled();
  const { correlations, loaded: correlationsLoaded, error: correlationsError } = useItsmFindingCorrelations(
    findingId,
    { enabled: loadWhen },
  );
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const reload = useCallback(async (): Promise<void> => {
    invalidateItsmFindingCorrelations(findingId);
  }, [findingId]);

  const jiraLinked = correlations.some((c) => c.provider === "Jira");
  const azureBoardsLinked = correlations.some((c) => c.provider === "Azure Boards");
  const serviceNowLinked = correlations.some((c) => c.provider === "ServiceNow");
  const linkageUnavailableMessage = isBuyerPolishedOperatorShellEnv()
    ? BUYER_DEMO_ITSM_LINKAGE_UNAVAILABLE
    : "ITSM linkage unavailable.";

  async function onCreate(provider: "Jira" | "ServiceNow" | "Azure Boards"): Promise<void> {
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
            disabled={busy || azureBoardsLinked}
            onClick={() => void onCreate("Azure Boards")}
            data-testid="itsm-sync-azure-boards"
            aria-label={
              azureBoardsLinked ? "Azure Boards work item already linked" : "Create linked Azure Boards work item"
            }
          >
            {azureBoardsLinked
              ? "Azure Boards linked"
              : compact
                ? "Sync Azure Boards"
                : "Create Azure Boards work item"}
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
          {correlations.map((c: ItsmFindingCorrelationListItem) => (
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
      {correlationsLoaded && correlationsError && errorMessage === null ? (
        <p className={cn("text-red-700 dark:text-red-400", OPERATOR_TYPOGRAPHY.helper)}>{linkageUnavailableMessage}</p>
      ) : null}
    </div>
  );
}
