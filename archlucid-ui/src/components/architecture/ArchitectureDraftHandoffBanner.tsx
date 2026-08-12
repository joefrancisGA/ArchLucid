"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { reviewDetailPath } from "@/lib/architecture/architecture-routes";
import {
  ARCHITECTURE_DRAFT_HANDOFF_ACKNOWLEDGE_LABEL,
  ARCHITECTURE_DRAFT_HANDOFF_BANNER_LEAD,
  buildArchitectureDraftHandoffBannerTitle,
} from "@/lib/architecture/architecture-draft-handoff-gate";
import { DESIGN_TOKENS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

type ArchitectureDraftHandoffBannerProps = {
  readonly linkedReviewId: string;
  readonly linkedReviewTitle: string;
  readonly editorLocked: boolean;
  readonly onAcknowledgeEditAnyway: () => void;
};

export function ArchitectureDraftHandoffBanner(
  props: ArchitectureDraftHandoffBannerProps,
): React.JSX.Element {
  return (
    <div
      role="alert"
      data-testid="architecture-draft-handoff-banner"
      className={cn(DESIGN_TOKENS.callout.warn, "p-4 shadow-sm", OPERATOR_TYPOGRAPHY.body)}
    >
      <p className="m-0 font-semibold">{buildArchitectureDraftHandoffBannerTitle(props.linkedReviewTitle)}</p>
      <p className={cn("m-0 mt-1", OPERATOR_TYPOGRAPHY.helper)}>{ARCHITECTURE_DRAFT_HANDOFF_BANNER_LEAD}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button type="button" variant="primary" size="sm" asChild data-testid="architecture-draft-continue-review">
          <Link href={reviewDetailPath(props.linkedReviewId)}>Continue in review</Link>
        </Button>
        {props.editorLocked ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={props.onAcknowledgeEditAnyway}
            data-testid="architecture-draft-acknowledge-edit"
          >
            {ARCHITECTURE_DRAFT_HANDOFF_ACKNOWLEDGE_LABEL}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
