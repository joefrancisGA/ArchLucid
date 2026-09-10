import { askReviewQuestionsHref, ASK_REVIEW_QUESTIONS_PATH } from "@/lib/ask-review-questions-route";
import {
  ARCHITECTURES_LIST_PATH,
  architectureNestedAskPath,
  architectureNestedComparePath,
  architectureNestedFindingsPath,
  architectureNestedGraphPath,
  parseArchitectureNestedToolArchitectureId,
} from "@/lib/architecture/architecture-routes";
import { buildCompareTwoReviewsHref, COMPARE_TWO_REVIEWS_PATH } from "@/lib/compare-two-reviews-route";
import { comparePageHrefAdaptive } from "@/lib/compare-url-query-params";
import { evidenceGraphHref, EVIDENCE_GRAPH_PATH } from "@/lib/evidence-graph-route";
import { GOVERNANCE_FINDINGS_PATH } from "@/lib/governance/governance-route-paths";
import { governanceFindingsArchitectureScopeHrefFromSearch } from "@/lib/governance/governance-findings-architecture-scope";
import { extractArchitectureIdentityIdFromPathname } from "@/lib/desk-continuity-preference";
import { resolveOpenPackageRunId } from "@/lib/resolve-open-package-run-id";

export type WorkingDeskTool = "ask" | "compare" | "graph" | "findings";

export type ResolveWorkingDeskToolHrefInput = {
  readonly tool: WorkingDeskTool;
  readonly lastOpenArchitectureId?: string | null;
  readonly pathname?: string | null;
  readonly lastOpenReviewId?: string | null;
};

function trimmedId(value: string | null | undefined): string | null {
  const trimmed = value?.trim() ?? "";

  return trimmed.length > 0 ? trimmed : null;
}

function resolveArchitectureIdInScope(input: ResolveWorkingDeskToolHrefInput): string | null {
  const pathname = input.pathname ?? "";
  const fromPath =
    parseArchitectureNestedToolArchitectureId(pathname, "ask") ??
    parseArchitectureNestedToolArchitectureId(pathname, "compare") ??
    parseArchitectureNestedToolArchitectureId(pathname, "graph") ??
    parseArchitectureNestedToolArchitectureId(pathname, "findings") ??
    extractArchitectureIdentityIdFromPathname(pathname, "");

  return (
    trimmedId(fromPath) ??
    trimmedId(input.lastOpenArchitectureId)
  );
}

/** ADR 0079 / SY-08–11 — Working desk verbs never open bare peer Insights or unscoped findings. */
export function resolveWorkingDeskToolHref(input: ResolveWorkingDeskToolHrefInput): string {
  const architectureId = resolveArchitectureIdInScope(input);
  const openPackageRunId = resolveOpenPackageRunId({
    pathname: input.pathname ?? "",
    lastOpenReviewId: input.lastOpenReviewId,
  });

  if (architectureId === null) {
    return ARCHITECTURES_LIST_PATH;
  }

  switch (input.tool) {
    case "ask":
      if (openPackageRunId !== null) {
        return `${architectureNestedAskPath(architectureId)}?runId=${encodeURIComponent(openPackageRunId)}`;
      }

      return architectureNestedAskPath(architectureId);
    case "compare":
      if (openPackageRunId !== null) {
        const peerScoped = buildCompareTwoReviewsHref({
          baseRunId: openPackageRunId,
          architectureId,
        });
        const query = peerScoped.includes("?") ? peerScoped.slice(peerScoped.indexOf("?")) : "";

        return `${architectureNestedComparePath(architectureId)}${query}`;
      }

      return architectureNestedComparePath(architectureId);
    case "graph":
      if (openPackageRunId !== null) {
        return `${architectureNestedGraphPath(architectureId)}?runId=${encodeURIComponent(openPackageRunId)}`;
      }

      return architectureNestedGraphPath(architectureId);
    case "findings":
      return governanceFindingsArchitectureScopeHrefFromSearch(
        "",
        architectureId,
        architectureNestedFindingsPath(architectureId),
      );
    default: {
      const exhaustive: never = input.tool;

      return exhaustive;
    }
  }
}

export function isBarePeerInsightsToolPath(pathname: string, tool: WorkingDeskTool): boolean {
  const path = pathname.split("?")[0] ?? "";

  switch (tool) {
    case "ask":
      return path === ASK_REVIEW_QUESTIONS_PATH;
    case "compare":
      return path === COMPARE_TWO_REVIEWS_PATH;
    case "graph":
      return path === EVIDENCE_GRAPH_PATH;
    case "findings":
      return path === GOVERNANCE_FINDINGS_PATH;
    default: {
      const exhaustive: never = tool;

      return exhaustive;
    }
  }
}

/** Compare URL sync on nested architecture desk routes (SY-38). */
export function comparePageHrefOnBase(
  basePathname: string,
  priorRunId: string,
  laterRunId?: string | null,
): string {
  const href = comparePageHrefAdaptive(priorRunId, laterRunId);
  const queryIndex = href.indexOf("?");

  if (queryIndex < 0) {
    return basePathname;
  }

  return `${basePathname}${href.slice(queryIndex)}`;
}

/** Working peer Ask href with run scope on nested path when architecture is known. */
export function workingScopedAskHref(
  architectureId: string,
  runId?: string | null,
): string {
  const trimmedRunId = runId?.trim() ?? "";

  if (trimmedRunId.length > 0) {
    return `${architectureNestedAskPath(architectureId)}?runId=${encodeURIComponent(trimmedRunId)}`;
  }

  return architectureNestedAskPath(architectureId);
}
