"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { useWorkspaceMode } from "@/components/WorkspaceModeProvider";
import { useArchitectureDraftRegistryEntries } from "@/hooks/use-architecture-draft-registry-entries";

import { resolveReviewsHubHeaderPrimary } from "./reviews-hub-header-primary";

/**
 * Header actions for `/architecture/reviews`: single primary Start/Continue (TB-1541).
 * One draft → Continue that draft. Zero or many → Start (list chooses among many).
 * Working routes empty/multi-draft primaries to Architectures (AO-26).
 */
export function ReviewsHubHeaderActions(): React.JSX.Element {
  const { isWorkingMode } = useWorkspaceMode();
  const draftEntries = useArchitectureDraftRegistryEntries();
  const primary = resolveReviewsHubHeaderPrimary(draftEntries, { isWorkingMode });

  return (
    <div className="flex flex-wrap items-center gap-2" data-testid="reviews-hub-header-actions">
      <Button variant="primary" size="sm" asChild>
        <Link href={primary.href} className="no-underline" data-testid="runs-page-start-review">
          {primary.label}
        </Link>
      </Button>
    </div>
  );
}
