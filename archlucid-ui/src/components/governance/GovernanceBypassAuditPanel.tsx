"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { OperatorEmptyState } from "@/components/operator/OperatorShellMessage";
import { useWorkspaceActiveRun } from "@/components/WorkspaceActiveRunContext";
import { Card, CardContent } from "@/components/ui/card";
import {
  EnterpriseTable,
  EnterpriseTableBody,
  EnterpriseTableCell,
  EnterpriseTableHead,
  EnterpriseTableHeaderCell,
  EnterpriseTableHeadRow,
  EnterpriseTableRow,
} from "@/components/ui/enterprise-table";
import { formatUtc } from "@/app/(operator)/governance/audit/_sections/audit-page-helpers";
import type { AuditEvent } from "@/lib/api";
import { GOVERNANCE_BYPASS_INVOKED_EVENT_TYPE, parseGovernanceBypassAuditPayload } from "@/lib/governance/governance-bypass-audit-payload";
import { auditTrailNavHref } from "@/lib/audit-nav-paths";
import { listRecentGovernanceBypassAuditEvents } from "@/lib/list-recent-governance-bypass-audit-events";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { OPERATOR_BODY_INLINE_LINK_CLASS, OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

function resolveAuditActorLabel(event: AuditEvent): string {
  const name = event.actorUserName?.trim();

  if (name && name.length > 0) {
    return name;
  }

  return event.actorUserId?.trim() || "Unknown actor";
}

/** Governance dashboard panel surfacing recent pre-commit break-glass bypass audit events. */
export function GovernanceBypassAuditPanel(): React.JSX.Element {
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();
  const workspaceRun = useWorkspaceActiveRun();
  const auditHref = auditTrailNavHref(workspaceRun?.activeRunId ?? null);
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const reload = useCallback(async (): Promise<void> => {
    setLoading(true);
    setErrorMessage(null);

    try {
      const loaded = await listRecentGovernanceBypassAuditEvents({ days: 30, take: 25 });
      setEvents(loaded);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Could not load governance bypass audit events.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return (
    <Card
      className="border-amber-600/30 dark:border-amber-700/40"
      data-testid="governance-bypass-audit-panel"
    >
      <CardContent className="space-y-3 p-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="space-y-1">
            <h2 className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>
              Pre-commit governance bypass audit
            </h2>
            <p className={cn("m-0 max-w-3xl text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
              {buyerPolishedShell ? (
                <>
                  Recent break-glass commits that overrode pre-commit governance gates. Each event records the actor and
                  justification from the commit request.
                </>
              ) : (
                <>
                  Recent <span className="font-mono">{GOVERNANCE_BYPASS_INVOKED_EVENT_TYPE}</span> audit events from the
                  rolling 30-day window — actor, justification, and review context.
                </>
              )}
            </p>
          </div>
          <Link href={auditHref} className={OPERATOR_LINK.optional}>
            Open audit log
          </Link>
        </div>

        {loading ? (
          <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)} role="status">
            Loading governance bypass events…
          </p>
        ) : null}

        {!loading && errorMessage ? (
          <p className={cn("m-0 text-red-600 dark:text-red-400", OPERATOR_TYPOGRAPHY.body)} role="alert">
            {errorMessage}
          </p>
        ) : null}

        {!loading && !errorMessage && events.length === 0 ? (
          <OperatorEmptyState title="No governance bypass events in the last 30 days." />
        ) : null}

        {!loading && !errorMessage && events.length > 0 ? (
          <EnterpriseTable ariaLabel="Recent pre-commit governance bypass audit events">
            <EnterpriseTableHead>
              <EnterpriseTableHeadRow>
                <EnterpriseTableHeaderCell>When (UTC)</EnterpriseTableHeaderCell>
                <EnterpriseTableHeaderCell>Actor</EnterpriseTableHeaderCell>
                <EnterpriseTableHeaderCell>Justification</EnterpriseTableHeaderCell>
                <EnterpriseTableHeaderCell>Review</EnterpriseTableHeaderCell>
                <EnterpriseTableHeaderCell>Blocked findings</EnterpriseTableHeaderCell>
              </EnterpriseTableHeadRow>
            </EnterpriseTableHead>
            <EnterpriseTableBody>
              {events.map((event) => {
                const payload = parseGovernanceBypassAuditPayload(event.dataJson ?? "{}");
                const runId = event.runId?.trim() ?? "";

                return (
                  <EnterpriseTableRow key={event.eventId} data-testid={`governance-bypass-row-${event.eventId}`}>
                    <EnterpriseTableCell>{formatUtc(event.occurredUtc)}</EnterpriseTableCell>
                    <EnterpriseTableCell>{resolveAuditActorLabel(event)}</EnterpriseTableCell>
                    <EnterpriseTableCell className="max-w-md whitespace-normal">
                      {payload.justification ?? " — "}
                    </EnterpriseTableCell>
                    <EnterpriseTableCell>
                      {runId.length > 0 ? (
                        <Link
                          href={`/architecture/reviews/${encodeURIComponent(runId)}`}
                          className={OPERATOR_LINK.nav}
                        >
                          {runId}
                        </Link>
                      ) : (
                        " — "
                      )}
                    </EnterpriseTableCell>
                    <EnterpriseTableCell>{payload.blockingFindingIds.length}</EnterpriseTableCell>
                  </EnterpriseTableRow>
                );
              })}
            </EnterpriseTableBody>
          </EnterpriseTable>
        ) : null}
      </CardContent>
    </Card>
  );
}
