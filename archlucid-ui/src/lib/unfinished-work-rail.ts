import { resolveRunHomeStatusTag } from "@/components/operator-home/runs-dashboard-helpers";
import type { ArchitectureDraftRegistryEntry } from "@/lib/architecture/architecture-draft-registry";
import { architectureDraftHasLinkedReview } from "@/lib/architecture/architecture-draft-handoff-gate";
import { ARCHITECTURE_DRAFT_STATUS_LABELS } from "@/lib/architecture/architecture-draft-status";
import { architectureDraftPath, reviewDetailPath, REVIEWS_NEW_PATH } from "@/lib/architecture/architecture-routes";
import { buyerFacingReviewTitleFromSummary } from "@/lib/buyer/buyer-facing-review-title";
import { isShowcaseSampleOfAnyKind } from "@/lib/demo-run-canonical";
import { ENTERPRISE_STATUS_LABELS } from "@/lib/design-tokens";
import { resolveOperatorHomeLatestDraftPrimaryAction } from "@/lib/operator-home-latest-draft-primary-action";
import { formatRelativeTime } from "@/lib/relative-time";
import {
  readWizardSessionSnapshot,
  WIZARD_SESSION_IDS,
  type WizardSessionId,
} from "@/lib/wizard-session-persistence";
import type { RunSummary } from "@/types/authority";

/** Cross-session unfinished work kinds surfaced on the operator continue rail (TB-2209). */
export type UnfinishedWorkRailItemKind =
  | "architecture-draft"
  | "review-in-progress"
  | "awaiting-disposition"
  | "incomplete-wizard";

export type UnfinishedWorkRailItem = {
  readonly id: string;
  readonly kind: UnfinishedWorkRailItemKind;
  readonly title: string;
  readonly href: string;
  readonly statusLabel: string;
  readonly updatedUtc: string | null;
  readonly workTypeLabel: string;
  readonly activityLabel: string | null;
  readonly actionLabel: string;
};

export type IncompleteWizardSignal = {
  readonly wizardId: WizardSessionId;
  readonly stepIndex: number;
  readonly savedAtUtc: string;
};

export type UnfinishedWorkRailInputs = {
  readonly drafts: readonly ArchitectureDraftRegistryEntry[];
  readonly runs: readonly RunSummary[];
  readonly incompleteWizards: readonly IncompleteWizardSignal[];
  /** Soft cap for the compact rail (default 6). */
  readonly maxItems?: number;
};

import { OPERATOR_ATTENTION_KIND_LABELS } from "@/lib/operator/operator-attention-taxonomy";

export const UNFINISHED_WORK_RAIL_TITLE = OPERATOR_ATTENTION_KIND_LABELS["unfinished-work"];

export const UNFINISHED_WORK_RAIL_STATUS_LABELS: Record<UnfinishedWorkRailItemKind, string> = {
  "architecture-draft": "Draft",
  "review-in-progress": "In progress",
  "awaiting-disposition": "Ready for review",
  "incomplete-wizard": "In progress",
};

export const UNFINISHED_WORK_RAIL_WORK_TYPE_LABELS: Record<UnfinishedWorkRailItemKind, string> = {
  "architecture-draft": "Architecture draft",
  "review-in-progress": "Architecture review",
  "awaiting-disposition": "Architecture review",
  "incomplete-wizard": "Setup wizard",
};

export const UNFINISHED_WORK_RAIL_ACTION_LABEL = "Continue";

function formatRailActivityLabel(updatedUtc: string | null): string | null {
  if (updatedUtc === null || updatedUtc.trim().length === 0) {
    return null;
  }

  return `Updated ${formatRelativeTime(updatedUtc)}`;
}

function buildRailItemBase(
  item: Omit<UnfinishedWorkRailItem, "workTypeLabel" | "activityLabel" | "actionLabel">,
): UnfinishedWorkRailItem {
  return {
    ...item,
    workTypeLabel: UNFINISHED_WORK_RAIL_WORK_TYPE_LABELS[item.kind],
    activityLabel: formatRailActivityLabel(item.updatedUtc),
    actionLabel: UNFINISHED_WORK_RAIL_ACTION_LABEL,
  };
}

const KIND_PRIORITY: Record<UnfinishedWorkRailItemKind, number> = {
  "awaiting-disposition": 0,
  "review-in-progress": 1,
  "architecture-draft": 2,
  "incomplete-wizard": 3,
};

const DEFAULT_MAX_ITEMS = 6;

type WizardRailMeta = {
  readonly title: string;
  readonly href: string;
};

const WIZARD_RAIL_META: Record<WizardSessionId, WizardRailMeta> = {
  [WIZARD_SESSION_IDS.reviewsNewTemplates]: {
    title: "New architecture review (detailed)",
    href: `${REVIEWS_NEW_PATH}?path=detailed`,
  },
  [WIZARD_SESSION_IDS.reviewsNewQuickStart]: {
    title: "New architecture review (quick start)",
    href: `${REVIEWS_NEW_PATH}?path=quick-review`,
  },
  [WIZARD_SESSION_IDS.reviewsNewGuidedQuestions]: {
    title: "New architecture review (guided questions)",
    href: `${REVIEWS_NEW_PATH}?path=guided-intake`,
  },
  [WIZARD_SESSION_IDS.pilotBaseline]: {
    title: "Pilot baseline",
    href: "/administration/baseline",
  },
  [WIZARD_SESSION_IDS.adminSsoWizard]: {
    title: "SSO setup",
    href: "/administration/identity/sso-wizard",
  },
};

function isExcludedRun(run: RunSummary): boolean {
  if (run.demoSeededOverviewInject === true) {
    return true;
  }

  if (isShowcaseSampleOfAnyKind(run.runId ?? "")) {
    return true;
  }

  if (run.isArchived === true) {
    return true;
  }

  return false;
}

function isAwaitingDispositionRun(run: RunSummary): boolean {
  return run.hasFindingsSnapshot === true && run.hasGoldenManifest !== true;
}

function isMidExecuteRun(run: RunSummary): boolean {
  if (run.hasGoldenManifest === true) {
    return false;
  }

  if (run.hasFindingsSnapshot === true) {
    return false;
  }

  return true;
}

function resolveReviewTitle(run: RunSummary): string {
  return buyerFacingReviewTitleFromSummary(run);
}

function normalizeUnfinishedWorkRailTitle(title: string): string {
  return title.trim().toLowerCase();
}

/** Drops draft rows when an active review row already represents the same lifecycle title. */
function collapseUnfinishedWorkLifecycleDuplicates(
  items: readonly UnfinishedWorkRailItem[],
): UnfinishedWorkRailItem[] {
  const activeReviewTitles = new Set(
    items
      .filter(
        (item) => item.kind === "review-in-progress" || item.kind === "awaiting-disposition",
      )
      .map((item) => normalizeUnfinishedWorkRailTitle(item.title)),
  );

  if (activeReviewTitles.size === 0) {
    return [...items];
  }

  return items.filter((item) => {
    if (item.kind !== "architecture-draft") {
      return true;
    }

    return !activeReviewTitles.has(normalizeUnfinishedWorkRailTitle(item.title));
  });
}

function compareRailItems(left: UnfinishedWorkRailItem, right: UnfinishedWorkRailItem): number {
  const priorityDelta = KIND_PRIORITY[left.kind] - KIND_PRIORITY[right.kind];

  if (priorityDelta !== 0) {
    return priorityDelta;
  }

  const leftUpdated = left.updatedUtc ?? "";
  const rightUpdated = right.updatedUtc ?? "";

  return rightUpdated.localeCompare(leftUpdated);
}

function buildDraftItems(
  drafts: readonly ArchitectureDraftRegistryEntry[],
): UnfinishedWorkRailItem[] {
  return drafts
    .filter((entry) => entry.customerStatus !== "archived")
    .filter((entry) => !architectureDraftHasLinkedReview(entry))
    .filter((entry) => (entry.architectureId?.trim().length ?? 0) > 0)
    .map((entry) => {
      const statusLabel =
        entry.customerStatus === "draft"
          ? UNFINISHED_WORK_RAIL_STATUS_LABELS["architecture-draft"]
          : ARCHITECTURE_DRAFT_STATUS_LABELS[entry.customerStatus];

      const draftPrimary = resolveOperatorHomeLatestDraftPrimaryAction(entry);

      return buildRailItemBase({
        id: `architecture-draft:${entry.architectureId}`,
        kind: "architecture-draft" as const,
        title: entry.displayName.trim().length > 0 ? entry.displayName : "Untitled architecture",
        href: draftPrimary?.href ?? architectureDraftPath(entry.architectureId),
        statusLabel,
        updatedUtc: entry.lastUpdatedUtc,
      });
    });
}

function resolveRunRailStatusLabel(run: RunSummary): string {
  const statusTag = resolveRunHomeStatusTag(run);

  return statusTag.label ?? ENTERPRISE_STATUS_LABELS[statusTag.kind];
}

function buildRunItems(runs: readonly RunSummary[]): UnfinishedWorkRailItem[] {
  const items: UnfinishedWorkRailItem[] = [];

  for (const run of runs) {
    if (isExcludedRun(run)) {
      continue;
    }

    const runId = run.runId?.trim() ?? "";

    if (runId.length === 0) {
      continue;
    }

    if (isAwaitingDispositionRun(run)) {
      items.push(
        buildRailItemBase({
          id: `awaiting-disposition:${runId}`,
          kind: "awaiting-disposition",
          title: resolveReviewTitle(run),
          href: reviewDetailPath(runId),
          statusLabel: resolveRunRailStatusLabel(run),
          updatedUtc: run.createdUtc ?? null,
        }),
      );
      continue;
    }

    if (isMidExecuteRun(run)) {
      items.push(
        buildRailItemBase({
          id: `review-in-progress:${runId}`,
          kind: "review-in-progress",
          title: resolveReviewTitle(run),
          href: reviewDetailPath(runId),
          statusLabel: resolveRunRailStatusLabel(run),
          updatedUtc: run.createdUtc ?? null,
        }),
      );
    }
  }

  return items;
}

function buildWizardItems(
  incompleteWizards: readonly IncompleteWizardSignal[],
): UnfinishedWorkRailItem[] {
  return incompleteWizards.map((signal) => {
    const meta = WIZARD_RAIL_META[signal.wizardId];

    return buildRailItemBase({
      id: `incomplete-wizard:${signal.wizardId}`,
      kind: "incomplete-wizard" as const,
      title: meta.title,
      href: meta.href,
      statusLabel: UNFINISHED_WORK_RAIL_STATUS_LABELS["incomplete-wizard"],
      updatedUtc: signal.savedAtUtc,
    });
  });
}

/**
 * Assembles the cross-session continue rail from drafts, mid-execute / awaiting-disposition
 * reviews, and incomplete wizard sessions — no new APIs (TB-2209).
 */
export function buildUnfinishedWorkRailItems(
  inputs: UnfinishedWorkRailInputs,
): readonly UnfinishedWorkRailItem[] {
  return summarizeUnfinishedWorkRailItems(inputs).items;
}

export type UnfinishedWorkRailSummary = {
  readonly items: readonly UnfinishedWorkRailItem[];
  readonly totalCount: number;
  readonly truncated: boolean;
};

/** Builds the rail list plus whether additional items were omitted by the soft cap. */
export function summarizeUnfinishedWorkRailItems(
  inputs: UnfinishedWorkRailInputs,
): UnfinishedWorkRailSummary {
  const maxItems =
    typeof inputs.maxItems === "number" && Number.isFinite(inputs.maxItems)
      ? Math.max(0, Math.trunc(inputs.maxItems))
      : DEFAULT_MAX_ITEMS;

  if (maxItems === 0) {
    return { items: [], totalCount: 0, truncated: false };
  }

  const combined = collapseUnfinishedWorkLifecycleDuplicates([
    ...buildRunItems(inputs.runs),
    ...buildDraftItems(inputs.drafts),
    ...buildWizardItems(inputs.incompleteWizards),
  ]);

  combined.sort(compareRailItems);

  return {
    items: combined.slice(0, maxItems),
    totalCount: combined.length,
    truncated: combined.length > maxItems,
  };
}

/** Highest-priority unfinished item for the Home recommended-next card. */
export function resolveRecommendedUnfinishedWorkRailItem(
  inputs: UnfinishedWorkRailInputs,
): UnfinishedWorkRailItem | null {
  const items = buildUnfinishedWorkRailItems({ ...inputs, maxItems: 1 });

  return items[0] ?? null;
}

const EMPTY_INCOMPLETE_WIZARD_SIGNALS: readonly IncompleteWizardSignal[] = [];

let cachedIncompleteWizardSignals: readonly IncompleteWizardSignal[] = EMPTY_INCOMPLETE_WIZARD_SIGNALS;
let cachedIncompleteWizardSignature = "";

function incompleteWizardSignature(signals: readonly IncompleteWizardSignal[]): string {
  return signals.map((signal) => `${signal.wizardId}:${signal.stepIndex}:${signal.savedAtUtc}`).join("|");
}

function readIncompleteWizardSignalsUncached(): IncompleteWizardSignal[] {
  if (typeof window === "undefined") {
    return [];
  }

  const signals: IncompleteWizardSignal[] = [];

  for (const wizardId of Object.values(WIZARD_SESSION_IDS)) {
    const snapshot = readWizardSessionSnapshot(wizardId);

    if (snapshot === null) {
      continue;
    }

    signals.push({
      wizardId,
      stepIndex: snapshot.stepIndex,
      savedAtUtc: snapshot.savedAtUtc,
    });
  }

  return signals;
}

/**
 * Browser-only scan of TB-2157 wizard session snapshots still open in this scope.
 * Returns a stable reference when contents are unchanged (for useSyncExternalStore).
 */
export function listIncompleteWizardSignals(): readonly IncompleteWizardSignal[] {
  const next = readIncompleteWizardSignalsUncached();
  const nextSignature = incompleteWizardSignature(next);

  if (nextSignature === cachedIncompleteWizardSignature) {
    return cachedIncompleteWizardSignals;
  }

  cachedIncompleteWizardSignature = nextSignature;
  cachedIncompleteWizardSignals = next.length === 0 ? EMPTY_INCOMPLETE_WIZARD_SIGNALS : next;

  return cachedIncompleteWizardSignals;
}

/** Test helper — clears the incomplete-wizard snapshot cache. */
export function resetIncompleteWizardSignalsCacheForTests(): void {
  cachedIncompleteWizardSignature = "";
  cachedIncompleteWizardSignals = EMPTY_INCOMPLETE_WIZARD_SIGNALS;
}

export function resolveWizardRailHref(wizardId: WizardSessionId): string {
  return WIZARD_RAIL_META[wizardId].href;
}
