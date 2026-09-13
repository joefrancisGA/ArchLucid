"use client";

import { useQuery } from "@tanstack/react-query";
import type { ReactElement } from "react";

import { OperatorApiProblem } from "@/components/operator/OperatorApiProblem";
import { listFindingDispositions } from "@/lib/api/governance-stickiness-api-dispositions";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { findingDispositionsBlockedReason } from "@/lib/governance/finding-dispositions-blocked-reason";
import {
  INHABIT_DISPOSITION_HISTORY_BLOCKED_FALLBACK,
  INHABIT_DISPOSITION_HISTORY_EMPTY_BODY,
  INHABIT_DISPOSITION_HISTORY_LOADING,
  INHABIT_DISPOSITION_HISTORY_SECTION_TITLE,
} from "@/lib/inhabit/inhabit-disposition-history-copy";
import { cn } from "@/lib/utils";

export type FindingDispositionHistorySectionProps = {
  readonly findingId: string;
  readonly testId?: string;
};

function formatDispositionHistoryActor(reviewerUserId: string | null | undefined): string {
  const trimmed = reviewerUserId?.trim() ?? "";

  if (trimmed.length === 0) {
    return "Unknown reviewer";
  }

  return trimmed;
}

/** IH-034 — durable disposition trail on Working inspect/panel (not toast-dependent). */
export function FindingDispositionHistorySection(
  props: FindingDispositionHistorySectionProps,
): ReactElement {
  const findingId = props.findingId.trim();
  const testId = props.testId ?? "finding-disposition-history";

  const query = useQuery({
    queryKey: ["finding-disposition-history", findingId],
    enabled: findingId.length > 0,
    staleTime: 30_000,
    queryFn: async () => listFindingDispositions(findingId),
  });

  if (findingId.length === 0) {
    return (
      <section className="space-y-2" data-testid={testId}>
        <h3 className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>
          {INHABIT_DISPOSITION_HISTORY_SECTION_TITLE}
        </h3>
        <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
          {INHABIT_DISPOSITION_HISTORY_EMPTY_BODY}
        </p>
      </section>
    );
  }

  if (query.isLoading) {
    return (
      <section className="space-y-2" data-testid={testId}>
        <h3 className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>
          {INHABIT_DISPOSITION_HISTORY_SECTION_TITLE}
        </h3>
        <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)} role="status">
          {INHABIT_DISPOSITION_HISTORY_LOADING}
        </p>
      </section>
    );
  }

  if (query.isError) {
    const failure = toApiLoadFailure(query.error);
    const blockedReason = findingDispositionsBlockedReason(failure);

    return (
      <section className="space-y-2" data-testid={testId}>
        <h3 className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>
          {INHABIT_DISPOSITION_HISTORY_SECTION_TITLE}
        </h3>
        <OperatorApiProblem failure={failure} variant="warning" />
        <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
          {blockedReason ?? INHABIT_DISPOSITION_HISTORY_BLOCKED_FALLBACK}
        </p>
      </section>
    );
  }

  const history = query.data ?? [];

  if (history.length === 0) {
    return (
      <section className="space-y-2" data-testid={testId}>
        <h3 className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>
          {INHABIT_DISPOSITION_HISTORY_SECTION_TITLE}
        </h3>
        <p
          className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
          data-testid={`${testId}-empty`}
        >
          {INHABIT_DISPOSITION_HISTORY_EMPTY_BODY}
        </p>
      </section>
    );
  }

  return (
    <section className="space-y-2" data-testid={testId}>
      <h3 className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>
        {INHABIT_DISPOSITION_HISTORY_SECTION_TITLE}
      </h3>
      <ul className="m-0 list-disc space-y-1 pl-5" data-testid={`${testId}-list`}>
        {history.map((event) => (
          <li
            key={event.eventId}
            className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
            data-testid={`${testId}-event-${event.eventId}`}
          >
            <span className="font-medium text-al-text-primary">{event.disposition}</span>
            {" · "}
            {formatDispositionHistoryActor(event.reviewerUserId)}
            {" · "}
            {event.occurredAtUtc}
            {event.rationale !== null && event.rationale !== undefined && event.rationale.trim().length > 0
              ? ` — ${event.rationale.trim()}`
              : ""}
          </li>
        ))}
      </ul>
    </section>
  );
}
