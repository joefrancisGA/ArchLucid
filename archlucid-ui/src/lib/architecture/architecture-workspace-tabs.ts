import { CREATE_ARCHITECTURE_INTENT } from "@/lib/architecture/architecture-workflow-intent";
import { FROM_GENERATION_QUERY_KEY } from "@/lib/review-generation-handoff";

/**
 * Create-home ArchitectureCreatedWorkspace tabs use `?archTab=`; committed review packages
 * use `?reviewTab=` on ReviewDetailWorkspace instead — `archTab` is ignored there (TB-1831).
 */
export const ARCHITECTURE_WORKSPACE_TAB_PARAM = "archTab" as const;

export type BuildArchitectureWorkspaceTabHrefOptions = {
  /** Opt in when a deep link must mount create-home chrome (TB-1833). */
  readonly includeCreateIntent?: boolean;
};

export const ARCHITECTURE_WORKSPACE_TAB_IDS = [
  "overview",
  "diagram",
  "clarifications",
  "findings",
  "evidence",
  "governance",
  "activity",
] as const;

export type ArchitectureWorkspaceTabId = (typeof ARCHITECTURE_WORKSPACE_TAB_IDS)[number];

export const ARCHITECTURE_WORKSPACE_DEFAULT_TAB: ArchitectureWorkspaceTabId = "overview";

export const ARCHITECTURE_WORKSPACE_TAB_LABELS: Record<ArchitectureWorkspaceTabId, string> = {
  overview: "Overview",
  diagram: "Diagram",
  clarifications: "Clarifications",
  findings: "Findings",
  evidence: "Evidence",
  governance: "Governance",
  activity: "Activity",
};

const LEGACY_HASH_TO_TAB: Readonly<Record<string, ArchitectureWorkspaceTabId>> = {
  "architecture-diagram": "diagram",
  "run-explanation": "findings",
  "capture-evidence": "evidence",
  "architecture-assessment-progress": "activity",
  "submitted-architecture": "overview",
};

export function isArchitectureWorkspaceTabId(value: string | null | undefined): value is ArchitectureWorkspaceTabId {
  if (value === null || value === undefined || value.trim().length === 0) {
    return false;
  }

  return (ARCHITECTURE_WORKSPACE_TAB_IDS as readonly string[]).includes(value);
}

export function resolveArchitectureWorkspaceTab(
  paramValue: string | null | undefined,
): ArchitectureWorkspaceTabId {
  if (isArchitectureWorkspaceTabId(paramValue)) {
    return paramValue;
  }

  return ARCHITECTURE_WORKSPACE_DEFAULT_TAB;
}

export function resolveArchitectureWorkspaceTabFromHash(
  hash: string | null | undefined,
): ArchitectureWorkspaceTabId | null {
  if (hash === null || hash === undefined) {
    return null;
  }

  const normalized = hash.replace(/^#/, "").trim();

  if (normalized.length === 0) {
    return null;
  }

  return LEGACY_HASH_TO_TAB[normalized] ?? null;
}

export function buildArchitectureWorkspaceTabHref(
  runId: string,
  tab: ArchitectureWorkspaceTabId,
  options?: BuildArchitectureWorkspaceTabHrefOptions,
): string {
  const params = new URLSearchParams({
    [ARCHITECTURE_WORKSPACE_TAB_PARAM]: tab,
  });

  if (options?.includeCreateIntent === true) {
    params.set(FROM_GENERATION_QUERY_KEY, "1");
    params.set("intent", CREATE_ARCHITECTURE_INTENT);
  }

  return `/architecture/reviews/${encodeURIComponent(runId.trim())}?${params.toString()}`;
}

export function readArchitectureWorkspaceTabFromHref(href: string): ArchitectureWorkspaceTabId | null {
  try {
    const url = new URL(href, "http://archlucid.local");
    const fromHash = resolveArchitectureWorkspaceTabFromHash(url.hash.slice(1));

    if (fromHash !== null) {
      return fromHash;
    }

    const fromParam = url.searchParams.get(ARCHITECTURE_WORKSPACE_TAB_PARAM);

    if (isArchitectureWorkspaceTabId(fromParam)) {
      return fromParam;
    }

    return null;
  } catch {
    return null;
  }
}
