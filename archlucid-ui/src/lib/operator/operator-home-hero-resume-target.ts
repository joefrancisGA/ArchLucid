import type { ArchitectureDraftRegistryEntry } from "@/lib/architecture/architecture-draft-registry";
import { resolveOperatorHomeLatestDraftPrimaryAction } from "@/lib/operator-home-latest-draft-primary-action";
import { resolveContinueLastArchitectureIdentityTarget } from "@/lib/resolve-continue-last-architecture-identity";
import {
  resolveRecommendedUnfinishedWorkRailItem,
  type IncompleteWizardSignal,
} from "@/lib/unfinished-work-rail";
import { resolveRunIdFromWorkingReviewHref } from "@/lib/system-not-job-portfolio-resume-href";
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

/** Compare resume targets without query/hash noise or trailing-slash drift. */
export function normalizeResumeHrefForMatch(href: string): string {
  const withoutFragment = href.split("#")[0] ?? href;
  const withoutQuery = withoutFragment.split("?")[0]?.trim() ?? "";

  if (withoutQuery.length === 0) {
    return href.trim();
  }

  return withoutQuery.replace(/\/+$/, "") || withoutQuery;
}

/**
 * True when two resume hrefs should collapse for dedupe (home CTAs, recent views).
 * Same path with different SN-012 `highlightReviewId` values stays distinct.
 */
export function resumeHrefsEquivalentForDedupe(left: string, right: string): boolean {
  if (normalizeResumeHrefForMatch(left) !== normalizeResumeHrefForMatch(right)) {
    return false;
  }

  const leftRunId = resolveRunIdFromWorkingReviewHref(left);
  const rightRunId = resolveRunIdFromWorkingReviewHref(right);

  if (leftRunId !== null || rightRunId !== null) {
    return leftRunId !== null && rightRunId !== null && leftRunId === rightRunId;
  }

  return true;
}

/** Union explicit resume run id fields with SN-012 / peer href parsing for dedupe. */
export function collectResumeRunIdsForMatch(
  href: string,
  explicitRunId?: string | null,
): readonly string[] {
  const ids = new Set<string>();
  const explicit = explicitRunId?.trim() ?? "";

  if (explicit.length > 0) {
    ids.add(explicit);
  }

  const fromHref = resolveRunIdFromWorkingReviewHref(href);

  if (fromHref !== null && fromHref.length > 0) {
    ids.add(fromHref);
  }

  return [...ids];
}

function draftIdFromDraftHref(href: string): string | null {
  const match = /^\/architecture\/architectures\/([^/?#]+)/.exec(href.split("?")[0] ?? "");

  if (match === null) {
    return null;
  }

  try {
    const draftId = decodeURIComponent(match[1]).trim();

    return draftId.length > 0 ? draftId : null;
  } catch {
    return null;
  }
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
      runId: resolveRunIdFromWorkingReviewHref(latestDraftPrimary.href) ?? undefined,
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
    runId: resolveRunIdFromWorkingReviewHref(recommendedItem.href) ?? undefined,
  };
}

export function matchesOperatorHomeHeroResumeTarget(
  target: OperatorHomeHeroResumeTarget | null,
  item: { readonly href: string; readonly draftId?: string; readonly runId?: string },
): boolean {
  if (target === null) {
    return false;
  }

  if (resumeHrefsEquivalentForDedupe(target.href, item.href)) {
    return true;
  }

  const heroRunId = resolveRunIdFromWorkingReviewHref(target.href);
  const itemHrefRunId = resolveRunIdFromWorkingReviewHref(item.href);

  if (
    normalizeResumeHrefForMatch(target.href) === normalizeResumeHrefForMatch(item.href)
    && heroRunId !== null
    && itemHrefRunId !== null
    && heroRunId !== itemHrefRunId
  ) {
    return false;
  }

  const targetRunIds = collectResumeRunIdsForMatch(target.href, target.runId);
  const itemRunIds = collectResumeRunIdsForMatch(item.href, item.runId);

  if (targetRunIds.some((left) => itemRunIds.includes(left))) {
    return true;
  }

  const targetDraftId = target.draftId?.trim() ?? "";
  const itemDraftId = item.draftId?.trim() ?? "";
  const heroDraftId = draftIdFromDraftHref(target.href);
  const itemHrefDraftId = draftIdFromDraftHref(item.href);

  const targetDraftIds = [targetDraftId, heroDraftId ?? ""].filter((id) => id.length > 0);
  const itemDraftIds = [itemDraftId, itemHrefDraftId ?? ""].filter((id) => id.length > 0);

  if (targetDraftIds.some((left) => itemDraftIds.some((right) => left === right))) {
    return true;
  }

  return false;
}

export function resolveRunIdFromHomeReviewHref(href: string): string | null {
  return resolveRunIdFromWorkingReviewHref(href);
}
