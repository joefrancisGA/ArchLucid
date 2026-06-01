"use client";

import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  createItsmOutboundIssue,
  listItsmFindingCorrelations,
  type ItsmFindingCorrelationListItem,
} from "@/lib/api/itsm-outbound-api";

export type FindingInspectItsmWorkflowPanelProps = {
  readonly findingId: string;
};

/** TB-063: one-click Jira / ServiceNow outbound from finding inspect. */
export function FindingInspectItsmWorkflowPanel({ findingId }: FindingInspectItsmWorkflowPanelProps) {
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
        if (!cancelled) setErrorMessage("ITSM linkage data is unavailable for this finding.");
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
      setStatusMessage(`${created.provider} ticket ${created.externalKey} created.`);
      await reload();
    } catch (e) {
      const message = e instanceof Error ? e.message : "ITSM create failed.";
      setErrorMessage(message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="text-base">ITSM work items</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <p className="text-neutral-500 dark:text-neutral-400">
          Create a linked Jira issue or ServiceNow incident from this finding. Duplicate creation per provider is
          blocked when a correlation already exists.
        </p>

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={busy || jiraLinked}
            onClick={() => void onCreate("Jira")}
          >
            {jiraLinked ? "Jira linked" : "Create Jira issue"}
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={busy || serviceNowLinked}
            onClick={() => void onCreate("ServiceNow")}
          >
            {serviceNowLinked ? "ServiceNow linked" : "Create ServiceNow incident"}
          </Button>
        </div>

        {correlations.length > 0 ? (
          <ul className="space-y-2">
            {correlations.map((c) => (
              <li key={`${c.provider}-${c.externalKey}`} className="rounded-md border px-3 py-2">
                <span className="font-medium">{c.provider}</span> · <code>{c.externalKey}</code>
                {c.externalUrl ? (
                  <>
                    {" "}
                    ·{" "}
                    <a
                      href={c.externalUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-al-accent underline"
                    >
                      Open in {c.provider}
                    </a>
                  </>
                ) : null}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-neutral-500 dark:text-neutral-400">No external tickets linked yet.</p>
        )}

        {statusMessage ? <p className="text-green-700 dark:text-green-400">{statusMessage}</p> : null}
        {errorMessage ? <p className="text-red-700 dark:text-red-400">{errorMessage}</p> : null}
      </CardContent>
    </Card>
  );
}
