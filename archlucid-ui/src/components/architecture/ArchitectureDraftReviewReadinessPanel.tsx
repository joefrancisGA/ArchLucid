"use client";

import { ArchitectureDraftSaveStatus } from "@/components/architecture/ArchitectureDraftSaveStatus";
import { PreExecuteCostEstimateNotice } from "@/components/usability/PreExecuteCostEstimateNotice";
import { StatusTag } from "@/components/ui/status-tag";
import type { ArchitectureDraftSaveState } from "@/hooks/use-architecture-draft-autosave";
import { ARCHITECTURE_DRAFT_REVIEW_READINESS_RAIL_TITLE } from "@/lib/architecture/architecture-draft-form-section-copy";
import {
  architectureReviewReadinessRemainingCount,
  formatArchitectureReviewReadinessHeadline,
  type ArchitectureReviewReadinessChecklistItem,
} from "@/lib/architecture/architecture-review-readiness-copy";
import { DESIGN_TOKENS, OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

type ArchitectureDraftReviewReadinessPanelProps = {
  readonly variant: "rail" | "footer-summary";
  readonly checklist: readonly ArchitectureReviewReadinessChecklistItem[];
  readonly saveState: ArchitectureDraftSaveState;
  readonly lastSavedUtc: string | null;
  readonly autosaveActive: boolean;
  readonly hasPersistedDraft: boolean;
  readonly showCostEstimate: boolean;
};

function scrollToAnchor(anchorId: string): void {
  document.getElementById(anchorId)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function ReadinessChecklistItem(props: {
  readonly item: ArchitectureReviewReadinessChecklistItem;
}): React.JSX.Element {
  const statusKind = props.item.complete ? "ready" : "needs-attention";
  const statusLabel = props.item.complete ? "Complete" : "Needs attention";

  return (
    <li className="flex flex-wrap items-center gap-2">
      <StatusTag
        kind={statusKind}
        label={statusLabel}
        data-testid={`architecture-draft-readiness-item-${props.item.id}`}
      />
      {props.item.complete ? (
        <span className={OPERATOR_TYPOGRAPHY.body}>{props.item.label}</span>
      ) : (
        <a
          href={`#${props.item.anchorId}`}
          className={cn(OPERATOR_LINK.inline, OPERATOR_TYPOGRAPHY.body)}
          onClick={(event) => {
            event.preventDefault();
            scrollToAnchor(props.item.anchorId);
          }}
          data-testid={`architecture-draft-readiness-jump-${props.item.id}`}
        >
          {props.item.label}
        </a>
      )}
    </li>
  );
}

/** Persistent readiness checklist for the draft workspace rail and sticky footer summary. */
export function ArchitectureDraftReviewReadinessPanel(
  props: ArchitectureDraftReviewReadinessPanelProps,
): React.JSX.Element {
  const remainingCount = architectureReviewReadinessRemainingCount(props.checklist);
  const headline = formatArchitectureReviewReadinessHeadline(props.checklist);

  if (props.variant === "footer-summary") {
    return (
      <div className="min-w-0 space-y-1" data-testid="architecture-draft-readiness-footer-summary">
        <p className={cn("m-0 font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>{headline}</p>
        {remainingCount > 0 ? (
          <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
            Select an item in Review readiness on large screens, or complete the highlighted fields below.
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <div
      className={cn(DESIGN_TOKENS.surface.card, "space-y-4 p-4")}
      data-testid="architecture-draft-readiness-rail"
    >
      <div className="space-y-1">
        <h2 className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}>{ARCHITECTURE_DRAFT_REVIEW_READINESS_RAIL_TITLE}</h2>
        <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>{headline}</p>
      </div>

      <ul className="m-0 list-none space-y-2 p-0" data-testid="architecture-draft-readiness-checklist">
        {props.checklist.map((item) => (
          <ReadinessChecklistItem key={item.id} item={item} />
        ))}
      </ul>

      {props.showCostEstimate ? (
        <PreExecuteCostEstimateNotice
          className="p-3"
          testId="architecture-draft-readiness-cost"
        />
      ) : null}

      <ArchitectureDraftSaveStatus
        saveState={props.saveState}
        lastSavedUtc={props.lastSavedUtc}
        autosaveActive={props.autosaveActive}
        hasPersistedDraft={props.hasPersistedDraft}
      />
    </div>
  );
}
