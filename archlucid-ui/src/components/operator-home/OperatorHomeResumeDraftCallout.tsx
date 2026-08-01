"use client";

import Link from "next/link";

import type { ArchitectureDraftRegistryEntry } from "@/lib/architecture-draft-registry";
import { Button } from "@/components/ui/button";
import {
  OPERATOR_HOME_RESUME_LATEST_DRAFT_CTA,
  formatOperatorHomeResumeDraftBridge,
} from "@/lib/buyer-polish-copy";
import { OPERATOR_LAYOUT, OPERATOR_TYPE_SCALE } from "@/lib/design-tokens";
import { resolveLatestArchitectureDraftHref } from "@/lib/resolve-operator-home-workspace-phase";
import { cn } from "@/lib/utils";

type OperatorHomeResumeDraftCalloutProps = {
  readonly draftEntries: readonly ArchitectureDraftRegistryEntry[];
};

/** Eval-with-drafts Overview — resume the most recently updated architecture draft. */
export function OperatorHomeResumeDraftCallout(
  props: OperatorHomeResumeDraftCalloutProps,
): React.JSX.Element | null {
  const resumeHref = resolveLatestArchitectureDraftHref(props.draftEntries);
  const latestDraft = props.draftEntries[0] ?? null;

  if (resumeHref === null || latestDraft === null) {
    return null;
  }

  return (
    <div
      className={cn("space-y-2", OPERATOR_LAYOUT.inlineGap)}
      data-testid="operator-home-resume-draft-callout"
    >
      <p
        className={cn("m-0 max-w-prose", OPERATOR_TYPE_SCALE.helper, "text-al-text-secondary")}
        data-testid="operator-home-resume-draft-bridge"
      >
        {formatOperatorHomeResumeDraftBridge(latestDraft.displayName, props.draftEntries.length)}
      </p>
      <Button asChild variant="primary" size="sm" className="h-8 w-fit shrink-0">
        <Link href={resumeHref} data-testid="operator-home-resume-draft-primary">
          {OPERATOR_HOME_RESUME_LATEST_DRAFT_CTA}
        </Link>
      </Button>
    </div>
  );
}
