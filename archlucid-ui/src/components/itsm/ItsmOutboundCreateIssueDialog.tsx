"use client";

import { cn } from "@/lib/utils";
import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { ItsmOutboundTriadClarityStrip } from "@/components/itsm/ItsmOutboundTriadClarityStrip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  createItsmOutboundIssue,
  listItsmFindingCorrelations,
  type ItsmFindingCorrelationListItem,
} from "@/lib/api/itsm-outbound-api";
import {
  ITSM_TICKET_LINKAGE_CREATE_INTRO,
  ITSM_TICKET_LINKAGE_DUPLICATE_BLOCKED,
} from "@/lib/vocabulary/finding-correlation-vocabulary";
import { OPERATOR_BODY_INLINE_LINK_CLASS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { useItsmNativeCreateEnabled } from "@/lib/use-itsm-native-create-enabled";
import { showSuccess } from "@/lib/toast";

export type ItsmOutboundProvider = "Jira" | "ServiceNow" | "Azure Boards";

export type ItsmOutboundCreateIssueDialogProps = {
  readonly findingId: string;
  readonly prominent?: boolean;
};

function isProviderLinked(
  correlations: readonly ItsmFindingCorrelationListItem[],
  provider: ItsmOutboundProvider,
): boolean {
  return correlations.some((correlation) => correlation.provider === provider);
}

/** Finding detail CTA: create a linked Jira issue or ServiceNow incident when native ITSM is enabled. */
export function ItsmOutboundCreateIssueDialog({
  findingId,
  prominent = false,
}: ItsmOutboundCreateIssueDialogProps): React.JSX.Element | null {
  const nativeCreateEnabled = useItsmNativeCreateEnabled();
  const [open, setOpen] = useState(false);
  const [provider, setProvider] = useState<ItsmOutboundProvider>("Jira");
  const [correlations, setCorrelations] = useState<ItsmFindingCorrelationListItem[]>([]);
  const [correlationsLoaded, setCorrelationsLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const reloadCorrelations = useCallback(async (): Promise<void> => {
    const body = await listItsmFindingCorrelations(findingId);
    setCorrelations(body.correlations ?? []);
    setCorrelationsLoaded(true);
  }, [findingId]);

  useEffect(() => {
    if (!nativeCreateEnabled) {
      return undefined;
    }

    let canceled = false;

    void (async () => {
      try {
        await reloadCorrelations();
      } catch {
        if (!canceled) {
          setCorrelationsLoaded(true);
        }
      }
    })();

    return () => {
      canceled = true;
    };
  }, [findingId, nativeCreateEnabled, reloadCorrelations]);

  useEffect(() => {
    if (!open) {
      return;
    }

    setErrorMessage(null);

    if (!isProviderLinked(correlations, "Jira")) {
      setProvider("Jira");
    } else if (!isProviderLinked(correlations, "Azure Boards")) {
      setProvider("Azure Boards");
    } else if (!isProviderLinked(correlations, "ServiceNow")) {
      setProvider("ServiceNow");
    }
  }, [correlations, open]);

  if (!nativeCreateEnabled) {
    return null;
  }

  const jiraLinked = isProviderLinked(correlations, "Jira");
  const azureBoardsLinked = isProviderLinked(correlations, "Azure Boards");
  const serviceNowLinked = isProviderLinked(correlations, "ServiceNow");
  const selectedProviderLinked = isProviderLinked(correlations, provider);
  const allProvidersLinked = jiraLinked && azureBoardsLinked && serviceNowLinked;

  async function onCreateIssue(): Promise<void> {
    if (selectedProviderLinked) {
      return;
    }

    setBusy(true);
    setErrorMessage(null);

    try {
      const created = await createItsmOutboundIssue(findingId, provider);
      showSuccess(`${created.provider} issue created: ${created.externalKey ?? "linked"}`);
      await reloadCorrelations();
      setOpen(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : "ITSM create failed.";
      setErrorMessage(message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Button
        type="button"
        variant={prominent ? "default" : "outline"}
        size={prominent ? "default" : "sm"}
        disabled={correlationsLoaded && allProvidersLinked}
        onClick={() => {
          setOpen(true);
        }}
        data-testid="itsm-create-issue-open"
      >
        Create issue
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md" data-testid="itsm-create-issue-dialog">
          <DialogHeader>
            <DialogTitle>Create linked work item</DialogTitle>
            <DialogDescription>
              {ITSM_TICKET_LINKAGE_CREATE_INTRO} {ITSM_TICKET_LINKAGE_DUPLICATE_BLOCKED}
            </DialogDescription>
          </DialogHeader>

          <ItsmOutboundTriadClarityStrip className="mb-0" />

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="itsm-create-provider">Provider</Label>
              <Select
                value={provider}
                onValueChange={(value) => {
                  setProvider(value as ItsmOutboundProvider);
                  setErrorMessage(null);
                }}
              >
                <SelectTrigger id="itsm-create-provider" data-testid="itsm-create-provider-select">
                  <SelectValue placeholder="Select provider" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Jira" disabled={jiraLinked}>
                    Jira{jiraLinked ? " (already linked)" : ""}
                  </SelectItem>
                  <SelectItem value="Azure Boards" disabled={azureBoardsLinked}>
                    Azure Boards{azureBoardsLinked ? " (already linked)" : ""}
                  </SelectItem>
                  <SelectItem value="ServiceNow" disabled={serviceNowLinked}>
                    ServiceNow{serviceNowLinked ? " (already linked)" : ""}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {correlations.length > 0 ? (
              <ul className={cn("space-y-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                {correlations.map((correlation) => (
                  <li key={`${correlation.provider}-${correlation.externalKey}`}>
                    <span className="font-medium text-al-text-primary">{correlation.provider}</span> ·{" "}
                    <code>{correlation.externalKey}</code>
                    {correlation.externalUrl ? (
                      <>
                        {" "}
                        ·{" "}
                        <a
                          href={correlation.externalUrl}
                          target="_blank"
                          rel="noreferrer"
                          className={OPERATOR_BODY_INLINE_LINK_CLASS}
                        >
                          Open
                        </a>
                      </>
                    ) : null}
                  </li>
                ))}
              </ul>
            ) : null}

            {errorMessage ? (
              <p className={cn("m-0 text-red-600 dark:text-red-400", OPERATOR_TYPOGRAPHY.body)} role="alert">
                {errorMessage}
              </p>
            ) : null}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={busy}
              onClick={() => {
                setOpen(false);
              }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              disabled={busy || selectedProviderLinked}
              onClick={() => {
                void onCreateIssue();
              }}
              data-testid="itsm-create-issue-submit"
            >
              {busy ? "Creating…" : provider === "Azure Boards" ? "Create work item" : "Create issue"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
