import type { ArchitectureDraftRegistryEntry } from "@/lib/architecture/architecture-draft-registry";
import { resolveOperatorHomeLatestDraftPrimaryAction } from "@/lib/operator-home-latest-draft-primary-action";
import { resolveContinueLastArchitectureIdentityTarget } from "@/lib/resolve-continue-last-architecture-identity";
import {
  resolveRecommendedUnfinishedWorkRailItem,
  type IncompleteWizardSignal,
} from "@/lib/unfinished-work-rail";
import type { RunSummary } from "@/types/authority";

export type OperatorHomeHeroResumeTarget = {
  readonly href: string;
  readonly draftId?: string;
  readonly runId?: string;
};

export type ResolveOperatorHomeHeroResumeTargetInput = {
  readonly drafts: readonly ArchitectureDraftRegistryEntry[];
  readonly runs?: readonly RunSummary[];
  readonly incompleteWizards?: readonly IncompleteWizardSignal[];
  readonly preferArchitectureIdentity?: boolean;
  /** When true, also considers the recommended-next unfinished item (default false). */
  readonly includeRecommendedUnfinishedItem?: boolean;
};

function runIdFromReviewHref(href: string): string | null {
  const match = /^\/architecture\/reviews\/([^/?#]+)/.exec(href.split("?")[0] ?? "");

  if (match === null) {
    return null;
  }

  const runId = decodeURIComponent(match[1]).trim();

  return runId.length > 0 ? runId : null;
}

function draftIdFromDraftHref(href: string): string | null {
  const match = /^\/architecture\/architectures\/([^/?#]+)/.exec(href.split("?")[0] ?? "");

  if (match === null) {
    return null;
  }

  const draftId = decodeURIComponent(match[1]).trim();

  return draftId.length > 0 ? draftId : null;
}

/** Canonical hero/header resume target — used to dedupe table row Continue actions (P1-11). */
export function resolveOperatorHomeHeroResumeTarget(
  input: ResolveOperatorHomeHeroResumeTargetInput,
): OperatorHomeHeroResumeTarget | null {
  if (input.preferArchitectureIdentity === true) {
    const architectureTarget = resolveContinueLastArchitectureIdentityTarget();

    if (architectureTarget !== null) {
      return { href: architectureTarget.href };
    }
  }

  const latestDraft = input.drafts[0] ?? null;
  const latestDraftPrimary = resolveOperatorHomeLatestDraftPrimaryAction(latestDraft);

  if (latestDraftPrimary !== null) {
    return {
      href: latestDraftPrimary.href,
      draftId: latestDraft?.draftId?.trim() ?? undefined,
      runId: runIdFromReviewHref(latestDraftPrimary.href) ?? undefined,
    };
  }

  const recommendedItem =
    input.includeRecommendedUnfinishedItem === true
      ? resolveRecommendedUnfinishedWorkRailItem({
          drafts: input.drafts,
          runs: input.runs ?? [],
          incompleteWizards: input.incompleteWizards ?? [],
        })
      : null;

  if (recommendedItem === null) {
    return null;
  }

  const draftId =
    recommendedItem.kind === "architecture-draft"
      ? draftIdFromDraftHref(recommendedItem.href) ?? recommendedItem.id.replace(/^architecture-draft:/, "")
      : undefined;

  return {
    href: recommendedItem.href,
    draftId: draftId !== undefined && draftId.trim().length > 0 ? draftId : undefined,
    runId: runIdFromReviewHref(recommendedItem.href) ?? undefined,
  };
}

export function matchesOperatorHomeHeroResumeTarget(
  target: OperatorHomeHeroResumeTarget | null,
  item: { readonly href: string; readonly draftId?: string; readonly runId?: string },
): boolean {
  if (target === null) {
    return false;
  }

  if (target.href === item.href) {
    return true;
  }

  const targetRunId = target.runId?.trim() ?? "";
  const itemRunId = item.runId?.trim() ?? "";

  if (targetRunId.length > 0 && itemRunId.length > 0 && targetRunId === itemRunId) {
    return true;
  }

  const targetDraftId = target.draftId?.trim() ?? "";
  const itemDraftId = item.draftId?.trim() ?? "";

  if (targetDraftId.length > 0 && itemDraftId.length > 0 && targetDraftId === itemDraftId) {
    return true;
  }

  const heroRunId = runIdFromReviewHref(target.href);
  const itemHrefRunId = runIdFromReviewHref(item.href);

  if (heroRunId !== null && itemHrefRunId !== null && heroRunId === itemHrefRunId) {
    return true;
  }

  const heroDraftId = draftIdFromDraftHref(target.href);
  const itemHrefDraftId = draftIdFromDraftHref(item.href);

  if (heroDraftId !== null && itemHrefDraftId !== null && heroDraftId === itemHrefDraftId) {
    return true;
  }

  return false;
}

export function resolveRunIdFromHomeReviewHref(href: string): string | null {
  return runIdFromReviewHref(href);
}
