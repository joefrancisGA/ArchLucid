import type { ArchitectureDraftRegistryEntry } from "@/lib/architecture/architecture-draft-registry";
import { architectureDraftHasLinkedReview } from "@/lib/architecture/architecture-draft-handoff-gate";
import { ARCHITECTURE_DRAFT_STATUS_LABELS } from "@/lib/architecture/architecture-draft-status";
import { architectureDraftPath, reviewDetailPath, REVIEWS_NEW_PATH } from "@/lib/architecture/architecture-routes";
import { buyerFacingReviewTitleFromSummary } from "@/lib/buyer/buyer-facing-review-title";
import { isShowcaseStaticDemoRunId } from "@/lib/demo-run-canonical";
import { SHOWCASE_BUYER_REVIEW_TITLE } from "@/lib/showcase-static-demo";
import { resolveOperatorHomeLatestDraftPrimaryAction } from "@/lib/operator-home-latest-draft-primary-action";
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
  "awaiting-disposition": "Awaiting disposition",
  "incomplete-wizard": "Incomplete wizard",
};

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

  if (isShowcaseStaticDemoRunId(run.runId ?? "")) {
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
  if (isShowcaseStaticDemoRunId(run.runId ?? "")) {
    return SHOWCASE_BUYER_REVIEW_TITLE;
  }

  const description = run.description?.trim() ?? "";

  if (description.length > 0) {
    return description;
  }

  return buyerFacingReviewTitleFromSummary(run);
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

      return {
        id: `architecture-draft:${entry.architectureId}`,
        kind: "architecture-draft" as const,
        title: entry.displayName.trim().length > 0 ? entry.displayName : "Untitled architecture",
        href: draftPrimary?.href ?? architectureDraftPath(entry.architectureId),
        statusLabel,
        updatedUtc: entry.lastUpdatedUtc,
      };
    });
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
      items.push({
        id: `awaiting-disposition:${runId}`,
        kind: "awaiting-disposition",
        title: resolveReviewTitle(run),
        href: reviewDetailPath(runId),
        statusLabel: UNFINISHED_WORK_RAIL_STATUS_LABELS["awaiting-disposition"],
        updatedUtc: run.createdUtc ?? null,
      });
      continue;
    }

    if (isMidExecuteRun(run)) {
      items.push({
        id: `review-in-progress:${runId}`,
        kind: "review-in-progress",
        title: resolveReviewTitle(run),
        href: reviewDetailPath(runId),
        statusLabel: UNFINISHED_WORK_RAIL_STATUS_LABELS["review-in-progress"],
        updatedUtc: run.createdUtc ?? null,
      });
    }
  }

  return items;
}

function buildWizardItems(
  incompleteWizards: readonly IncompleteWizardSignal[],
): UnfinishedWorkRailItem[] {
  return incompleteWizards.map((signal) => {
    const meta = WIZARD_RAIL_META[signal.wizardId];

    return {
      id: `incomplete-wizard:${signal.wizardId}`,
      kind: "incomplete-wizard" as const,
      title: meta.title,
      href: meta.href,
      statusLabel: UNFINISHED_WORK_RAIL_STATUS_LABELS["incomplete-wizard"],
      updatedUtc: signal.savedAtUtc,
    };
  });
}

/**
 * Assembles the cross-session continue rail from drafts, mid-execute / awaiting-disposition
 * reviews, and incomplete wizard sessions — no new APIs (TB-2209).
 */
export function buildUnfinishedWorkRailItems(
  inputs: UnfinishedWorkRailInputs,
): readonly UnfinishedWorkRailItem[] {
  const maxItems =
    typeof inputs.maxItems === "number" && Number.isFinite(inputs.maxItems)
      ? Math.max(0, Math.trunc(inputs.maxItems))
      : DEFAULT_MAX_ITEMS;

  if (maxItems === 0) {
    return [];
  }

  const combined = [
    ...buildRunItems(inputs.runs),
    ...buildDraftItems(inputs.drafts),
    ...buildWizardItems(inputs.incompleteWizards),
  ];

  combined.sort(compareRailItems);

  return combined.slice(0, maxItems);
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
