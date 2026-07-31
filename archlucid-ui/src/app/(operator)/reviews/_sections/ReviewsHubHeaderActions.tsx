"use client";

import Link from "next/link";

import { ShortcutHint } from "@/components/ShortcutHint";
import { Button } from "@/components/ui/button";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import { useArchitectureDraftRegistryEntries } from "@/hooks/use-architecture-draft-registry-entries";
import { isOperatorExperienceFullShellEnv } from "@/lib/demo-ui-env";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import { resolveReviewsHubHeaderPrimary } from "./reviews-hub-header-primary";

/**
 * Header actions for `/reviews`: help + single primary Start/Continue (TB-1541).
 * One draft → Continue that draft. Zero or many → Start (list chooses among many).
 */
export function ReviewsHubHeaderActions(): React.JSX.Element {
  const draftEntries = useArchitectureDraftRegistryEntries();
  const fullShell = isOperatorExperienceFullShellEnv();
  const primary = resolveReviewsHubHeaderPrimary(draftEntries);

  return (
    <div className="flex flex-wrap items-center gap-2" data-testid="reviews-hub-header-actions">
      <PageContextualHelpButton />
      <div className="inline-flex items-center gap-1.5">
        <Button variant="primary" size="sm" asChild>
          <Link href={primary.href} className="no-underline" data-testid="runs-page-start-review">
            {primary.label}
          </Link>
        </Button>
        {fullShell ? <ShortcutHint shortcut="Alt+N" className={OPERATOR_TYPOGRAPHY.helper} /> : null}
      </div>
    </div>
  );
}
