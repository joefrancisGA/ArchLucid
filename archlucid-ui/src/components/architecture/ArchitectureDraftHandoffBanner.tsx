"use client";

import Link from "next/link";

import { ArchitectureDraftCloneSnapshotControl } from "@/components/architecture/ArchitectureDraftCloneSnapshotControl";
import { Button } from "@/components/ui/button";
import { resolveArchitectureReviewHref } from "@/lib/architecture/architecture-routes";
import {
  ARCHITECTURE_DRAFT_HANDOFF_BANNER_LEAD,
  ARCHITECTURE_DRAFT_HANDOFF_CANONICAL_REVIEW_LABEL,
  buildArchitectureDraftHandoffBannerTitle,
} from "@/lib/architecture/architecture-draft-handoff-gate";
import { DESIGN_TOKENS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

type ArchitectureDraftHandoffBannerProps = {
  readonly draftId: string;
  readonly linkedReviewId: string;
  readonly linkedReviewTitle: string;
  readonly parentArchitectureId?: string | null;
};

export function ArchitectureDraftHandoffBanner(
  props: ArchitectureDraftHandoffBannerProps,
): React.JSX.Element {
  const reviewHref = resolveArchitectureReviewHref(props.linkedReviewId, props.parentArchitectureId);

  return (
    <div
      role="alert"
      data-testid="architecture-draft-handoff-banner"
      className={cn(DESIGN_TOKENS.callout.warn, "p-4 shadow-sm", OPERATOR_TYPOGRAPHY.body)}
    >
      <p className="m-0 font-semibold">{buildArchitectureDraftHandoffBannerTitle(props.linkedReviewTitle)}</p>
      <p className={cn("m-0 mt-1", OPERATOR_TYPOGRAPHY.helper)}>{ARCHITECTURE_DRAFT_HANDOFF_BANNER_LEAD}</p>
      <p className={cn("m-0 mt-1", OPERATOR_TYPOGRAPHY.helper)}>{ARCHITECTURE_DRAFT_HANDOFF_CANONICAL_REVIEW_LABEL}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button type="button" variant="primary" size="sm" asChild data-testid="architecture-draft-continue-review">
          <Link href={reviewHref}>Continue in review</Link>
        </Button>
        <ArchitectureDraftCloneSnapshotControl
          draftId={props.draftId}
          parentArchitectureId={props.parentArchitectureId}
        />
      </div>
    </div>
  );
}
