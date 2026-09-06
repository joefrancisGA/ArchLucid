"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { StatusTag } from "@/components/ui/status-tag";
import { formatClarificationGapSourceLabel } from "@/lib/architecture/architecture-clarification-gap-present";
import type { ArchitectureMissingItem } from "@/lib/architecture/architecture-created-home-model";
import { REVIEWS_NEW_GUIDED_QUESTIONS_LABEL } from "@/lib/reviews-new-path-copy";
import { readArchitectureWorkspaceTabFromHref, type ArchitectureWorkspaceTabId } from "@/lib/architecture/architecture-workspace-tabs";
import type { EnterpriseStatusKind } from "@/lib/design-tokens";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export type ClarificationGapRowProps = {
  readonly item: ArchitectureMissingItem;
  readonly impact: string;
  readonly answerHref: string;
  readonly onNavigateTab: (tab: ArchitectureWorkspaceTabId) => void;
  readonly onDismiss: (itemId: string) => void;
  readonly hideOperatorActions?: boolean;
};

function GapActionLink(props: {
  readonly href: string;
  readonly label: string;
  readonly onNavigateTab: (tab: ArchitectureWorkspaceTabId) => void;
}): React.JSX.Element {
  const tab = readArchitectureWorkspaceTabFromHref(props.href);

  if (tab !== null) {
    return (
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => {
          props.onNavigateTab(tab);
        }}
      >
        {props.label}
      </Button>
    );
  }

  return (
    <Button type="button" variant="outline" size="sm" asChild>
      <Link href={props.href}>{props.label}</Link>
    </Button>
  );
}

function statusTagKindForCategory(category: ArchitectureMissingItem["category"]): EnterpriseStatusKind {
  switch (category) {
    case "clarification":
      return "needs-attention";

    case "evidence":
      return "blocked";

    case "assessment":
      return "in-progress";

    default: {
      const exhaustive: never = category;
      return exhaustive;
    }
  }
}

/** Enterprise work-queue row for a single architecture clarification or evidence gap. */
export function ClarificationGapRow(props: ClarificationGapRowProps): React.JSX.Element {
  const statusKind = statusTagKindForCategory(props.item.category);
  const sourceLabel = formatClarificationGapSourceLabel(props.item.source);
  const showDismiss = props.item.category === "clarification";

  return (
    <div
      className="flex flex-col gap-2 rounded-md border border-neutral-200 bg-white px-3 py-2 transition-colors hover:bg-neutral-50/80 dark:border-neutral-800 dark:bg-neutral-950 dark:hover:bg-neutral-900/60 sm:flex-row sm:items-center sm:justify-between"
      data-testid={`clarification-gap-row-${props.item.id}`}
    >
      <div className="min-w-0 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <StatusTag kind={statusKind} data-testid={`clarification-gap-status-${props.item.id}`} />
          <span className={cn("font-medium text-neutral-900 dark:text-neutral-100", OPERATOR_TYPOGRAPHY.body)}>
            {props.item.label}
          </span>
        </div>
        <p className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
          {props.impact}
        </p>
        <p className={cn("m-0 text-neutral-500 dark:text-neutral-500", OPERATOR_TYPOGRAPHY.micro)}>
          {sourceLabel}
        </p>
      </div>

      {props.hideOperatorActions === true ? null : props.item.category === "clarification" ? (
        <div className="flex shrink-0 flex-wrap gap-2">
          <GapActionLink
            href={props.answerHref}
            label={`Answer · ${REVIEWS_NEW_GUIDED_QUESTIONS_LABEL}`}
            onNavigateTab={props.onNavigateTab}
          />
          {showDismiss ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              data-testid={`clarification-gap-dismiss-${props.item.id}`}
              onClick={() => {
                props.onDismiss(props.item.id);
              }}
            >
              Not applicable
            </Button>
          ) : null}
        </div>
      ) : (
        <div className="flex shrink-0 flex-wrap gap-2">
          <GapActionLink href={props.item.href} label="View details" onNavigateTab={props.onNavigateTab} />
        </div>
      )}
    </div>
  );
}
