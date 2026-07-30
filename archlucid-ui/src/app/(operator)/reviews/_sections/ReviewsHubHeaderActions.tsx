"use client";

import Link from "next/link";

import { ShortcutHint } from "@/components/ShortcutHint";
import { Button } from "@/components/ui/button";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import { useArchitectureDraftRegistryEntries } from "@/hooks/use-architecture-draft-registry-entries";
import { architectureDraftPath } from "@/lib/architecture-routes";
import { isOperatorExperienceFullShellEnv } from "@/lib/demo-ui-env";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import {
  REVIEWS_HUB_PRIMARY_START_LABEL,
  REVIEWS_HUB_RECENT_EMPTY_WITH_DRAFT_PRIMARY_LABEL,
} from "./reviews-hub-copy";

/**
 * Header actions for `/reviews`: help + single primary Start/Continue (TB-1541).
 */
export function ReviewsHubHeaderActions(): React.JSX.Element {
  const draftEntries = useArchitectureDraftRegistryEntries();
  const resumeDraft = draftEntries[0] ?? null;
  const fullShell = isOperatorExperienceFullShellEnv();
  const primaryHref =
    resumeDraft !== null ? architectureDraftPath(resumeDraft.architectureId) : "/reviews/new";
  const primaryLabel =
    resumeDraft !== null ? REVIEWS_HUB_RECENT_EMPTY_WITH_DRAFT_PRIMARY_LABEL : REVIEWS_HUB_PRIMARY_START_LABEL;

  return (
    <div className="flex flex-wrap items-center gap-2" data-testid="reviews-hub-header-actions">
      <PageContextualHelpButton />
      <div className="inline-flex items-center gap-1.5">
        <Button variant="primary" size="sm" asChild>
          <Link href={primaryHref} className="no-underline" data-testid="runs-page-start-review">
            {primaryLabel}
          </Link>
        </Button>
        {fullShell ? <ShortcutHint shortcut="Alt+N" className={OPERATOR_TYPOGRAPHY.helper} /> : null}
      </div>
    </div>
  );
}
