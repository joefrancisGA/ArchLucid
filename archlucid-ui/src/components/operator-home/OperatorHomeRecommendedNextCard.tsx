"use client";

import Link from "next/link";
import { useMemo, useSyncExternalStore } from "react";

import { useArchitectureDraftRegistryEntries } from "@/hooks/use-architecture-draft-registry-entries";
import { countUnlinkedArchitectureDraftRegistryEntries } from "@/lib/architecture/architecture-draft-registry";
import { useOperatorHomeWorkspaceActivity } from "@/components/operator-home/operator-home-workspace-activity-context";
import { Button } from "@/components/ui/button";
import type { OperatorHomeRunsDashboardModel } from "@/app/(operator)/_sections/operator-home-runs-dashboard-model";
import {
  formatOperatorHomeRecommendedNextTitle,
  OPERATOR_HOME_RECOMMENDED_NEXT_HEADING,
} from "@/lib/buyer/buyer-polish-copy";
import { OPERATOR_CARD, OPERATOR_SURFACE_CARD_CLASS, OPERATOR_TYPOGRAPHY, OPERATOR_TYPE_SCALE } from "@/lib/design-tokens";
import { resolveOperatorHomeWorkspacePhase } from "@/lib/resolve-operator-home-workspace-phase";
import {
  listIncompleteWizardSignals,
  resolveRecommendedUnfinishedWorkRailItem,
  type UnfinishedWorkRailItemKind,
} from "@/lib/unfinished-work-rail";
import { cn } from "@/lib/utils";
import type { RunSummary } from "@/types/authority";

type OperatorHomeRecommendedNextCardProps = {
  readonly runsDashboard: OperatorHomeRunsDashboardModel;
};

function subscribeWizardSessions(onStoreChange: () => void): () => void {
  if (typeof window === "undefined") {
    return () => {};
  }

  const onStorage = (event: StorageEvent): void => {
    if (event.storageArea === window.sessionStorage) {
      onStoreChange();
    }
  };

  window.addEventListener("storage", onStorage);

  return () => {
    window.removeEventListener("storage", onStorage);
  };
}

function getIncompleteWizardSnapshot(): ReturnType<typeof listIncompleteWizardSignals> {
  return listIncompleteWizardSignals();
}

/** Prominent continue card for the highest-priority unfinished item on Home. */
export function OperatorHomeRecommendedNextCard(
  props: OperatorHomeRecommendedNextCardProps,
): React.JSX.Element | null {
  const drafts = useArchitectureDraftRegistryEntries();
  const { hasWorkspaceReviews, hasOverviewReviewRows, liveRunsSnapshot } = useOperatorHomeWorkspaceActivity();
  const incompleteWizards = useSyncExternalStore(
    subscribeWizardSessions,
    getIncompleteWizardSnapshot,
    getIncompleteWizardSnapshot,
  );
  const runs = liveRunsSnapshot?.items ?? props.runsDashboard.items;
  const activeDraftCount = countUnlinkedArchitectureDraftRegistryEntries(drafts);
  const workspacePhase = resolveOperatorHomeWorkspacePhase({
    hasWorkspaceReviews,
    hasOverviewReviewRows,
    draftCount: activeDraftCount,
    hasCommittedManifest: false,
    openFindingsCount: 0,
    governanceWarningsCount: 0,
  });
  const excludeKinds: readonly UnfinishedWorkRailItemKind[] =
    workspacePhase === "eval-with-drafts" ? ["architecture-draft"] : [];

  const recommendedItem = useMemo(() => {
    const item = resolveRecommendedUnfinishedWorkRailItem({
      drafts,
      runs,
      incompleteWizards,
    });

    if (item === null || excludeKinds.includes(item.kind)) {
      return null;
    }

    return item;
  }, [drafts, excludeKinds, incompleteWizards, runs]);

  const fallbackHref = useMemo((): string | null => {
    if (recommendedItem !== null) {
      return null;
    }

    const inProgressRun = runs.find((run: RunSummary) => {
      if (run.isArchived === true) {
        return false;
      }

      return run.hasGoldenManifest !== true;
    });

    if (inProgressRun?.runId !== undefined && inProgressRun.runId.trim().length > 0) {
      return `/architecture/reviews/${encodeURIComponent(inProgressRun.runId)}`;
    }

    return "/architecture/reviews/new";
  }, [recommendedItem, runs]);

  if (recommendedItem === null && fallbackHref === null) {
    return null;
  }

  const href = recommendedItem?.href ?? fallbackHref ?? "/architecture/reviews/new";
  const title = recommendedItem?.title ?? "your architecture review";
  const actionLabel =
    recommendedItem?.actionLabel ??
    (workspacePhase === "active-reviews" ? "Continue review" : "Start review");

  return (
    <section
      aria-labelledby="operator-home-recommended-next-heading"
      className={cn(OPERATOR_SURFACE_CARD_CLASS, OPERATOR_CARD.lifecycleEmphasized, "p-4")}
      data-testid="operator-home-recommended-next-card"
    >
      <h2
        id="operator-home-recommended-next-heading"
        className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle, "text-al-text-primary")}
      >
        {OPERATOR_HOME_RECOMMENDED_NEXT_HEADING}
      </h2>
      <p className={cn("m-0 mt-1", OPERATOR_TYPE_SCALE.helper, "text-al-text-secondary")}>
        {formatOperatorHomeRecommendedNextTitle(title)}
      </p>
      <div className="mt-3">
        <Button asChild variant="primary" size="sm" className="h-8 w-fit">
          <Link href={href} data-testid="operator-home-recommended-next-cta">
            {actionLabel}
          </Link>
        </Button>
      </div>
    </section>
  );
}
