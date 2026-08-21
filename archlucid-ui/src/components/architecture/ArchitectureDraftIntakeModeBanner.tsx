"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  ARCHITECTURE_DRAFT_INTAKE_MODE_CONTINUE_LABEL,
  ARCHITECTURE_DRAFT_INTAKE_MODE_TITLE,
  ARCHITECTURE_DRAFT_INTAKE_MODE_UNLOCK_LABEL,
  architectureDraftIntakeModeLead,
} from "@/lib/architecture/architecture-draft-intake-mode";
import { DESIGN_TOKENS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";
import type { DraftRequestStatus } from "@/types/draft-intake";

type ArchitectureDraftIntakeModeBannerProps = {
  readonly status: DraftRequestStatus;
  readonly continueHref: string;
  readonly canUnlock: boolean;
  readonly unlockBusy?: boolean;
  readonly onUnlock?: () => void;
};

/** Warns before editing when the architecture has already entered review intake. */
export function ArchitectureDraftIntakeModeBanner(
  props: ArchitectureDraftIntakeModeBannerProps,
): React.JSX.Element {
  return (
    <div
      role="alert"
      data-testid="architecture-draft-intake-mode-banner"
      className={cn(DESIGN_TOKENS.callout.warn, "p-4 shadow-sm", OPERATOR_TYPOGRAPHY.body)}
    >
      <p className="m-0 font-semibold">{ARCHITECTURE_DRAFT_INTAKE_MODE_TITLE}</p>
      <p className={cn("m-0 mt-1", OPERATOR_TYPOGRAPHY.helper)}>{architectureDraftIntakeModeLead(props.status)}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button type="button" variant="primary" size="sm" asChild data-testid="architecture-draft-continue-intake">
          <Link href={props.continueHref}>{ARCHITECTURE_DRAFT_INTAKE_MODE_CONTINUE_LABEL}</Link>
        </Button>
        {props.canUnlock ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={props.unlockBusy === true}
            onClick={props.onUnlock}
            data-testid="architecture-draft-unlock-brief"
          >
            {ARCHITECTURE_DRAFT_INTAKE_MODE_UNLOCK_LABEL}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
