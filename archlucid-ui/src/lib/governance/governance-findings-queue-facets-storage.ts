import {
  RISK_REGISTER_FILTER_LABELS,
  type RiskRegisterFilter,
} from "@/lib/architecture/architecture-risk-register-page";
import {
  DEFAULT_FINDING_JOB_VIEW,
  FINDING_JOB_VIEW_LABELS,
  type FindingJobView,
} from "@/lib/findings/finding-job-view";
import {
  EMPTY_FINDINGS_NATURAL_LANGUAGE_FACETS,
  type FindingsNaturalLanguageFacets,
  type FindingsNaturalLanguageSeverity,
  type FindingsNaturalLanguageStatus,
} from "@/lib/findings/findings-natural-language-filter";
import type { GovernanceFindingsQueueMode } from "@/lib/governance/governance-findings-queue-mode";

/** localStorage key for last-used governance findings queue facets (TB-2228). */
export const GOVERNANCE_FINDINGS_QUEUE_FACETS_STORAGE_KEY =
  "archlucid.governance.findingsQueueFacets.v1";

/** Separate facet namespace for assigned-to-me queue (P0-GOF-2). */
export const GOVERNANCE_FINDINGS_QUEUE_ASSIGNED_TO_ME_FACETS_STORAGE_KEY =
  "archlucid.governance.findingsQueueFacets.assigned-to-me.v1";

export type GovernanceFindingsQueueFacetsV1 = {
  registerFilter: RiskRegisterFilter;
  jobView?: FindingJobView;
  nlFacets?: FindingsNaturalLanguageFacets;
};

/** Normalized read result with defaults filled for optional fields. */
export type GovernanceFindingsQueueFacetsResolved = {
  registerFilter: RiskRegisterFilter;
  jobView: FindingJobView;
  nlFacets: FindingsNaturalLanguageFacets;
};

export const DEFAULT_GOVERNANCE_FINDINGS_QUEUE_FACETS: GovernanceFindingsQueueFacetsResolved = {
  registerFilter: "all",
  jobView: DEFAULT_FINDING_JOB_VIEW,
  nlFacets: EMPTY_FINDINGS_NATURAL_LANGUAGE_FACETS,
};

const RISK_REGISTER_FILTER_ALLOWLIST: ReadonlySet<string> = new Set(
  Object.keys(RISK_REGISTER_FILTER_LABELS),
);

const FINDING_JOB_VIEW_ALLOWLIST: ReadonlySet<string> = new Set(Object.keys(FINDING_JOB_VIEW_LABELS));

const NL_SEVERITY_ALLOWLIST: ReadonlySet<string> = new Set(["critical", "high", "medium", "low"]);

const NL_STATUS_ALLOWLIST: ReadonlySet<string> = new Set(["open", "disposed"]);

function storageKeyForMode(mode: GovernanceFindingsQueueMode = "tenant"): string {
  return mode === "assigned-to-me"
    ? GOVERNANCE_FINDINGS_QUEUE_ASSIGNED_TO_ME_FACETS_STORAGE_KEY
    : GOVERNANCE_FINDINGS_QUEUE_FACETS_STORAGE_KEY;
}

function isRiskRegisterFilter(value: unknown): value is RiskRegisterFilter {
  return typeof value === "string" && RISK_REGISTER_FILTER_ALLOWLIST.has(value);
}

function isFindingJobView(value: unknown): value is FindingJobView {
  return typeof value === "string" && FINDING_JOB_VIEW_ALLOWLIST.has(value);
}

function isNlSeverity(value: unknown): value is FindingsNaturalLanguageSeverity {
  return typeof value === "string" && NL_SEVERITY_ALLOWLIST.has(value);
}

function isNlStatus(value: unknown): value is FindingsNaturalLanguageStatus {
  return typeof value === "string" && NL_STATUS_ALLOWLIST.has(value);
}

function parseNlFacets(value: unknown): FindingsNaturalLanguageFacets | null {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const record = value as Record<string, unknown>;
  const severityRaw = record.severity;
  const statusRaw = record.status;
  const titleKeywordsRaw = record.titleKeywords;

  if (!Array.isArray(titleKeywordsRaw)) {
    return null;
  }

  const titleKeywords: string[] = [];

  for (const entry of titleKeywordsRaw) {
    if (typeof entry !== "string") {
      return null;
    }

    titleKeywords.push(entry);
  }

  let severity: FindingsNaturalLanguageSeverity | null = null;

  if (severityRaw !== null && severityRaw !== undefined) {
    if (!isNlSeverity(severityRaw)) {
      return null;
    }

    severity = severityRaw;
  }

  let status: FindingsNaturalLanguageStatus | null = null;

  if (statusRaw !== null && statusRaw !== undefined) {
    if (!isNlStatus(statusRaw)) {
      return null;
    }

    status = statusRaw;
  }

  return {
    severity,
    status,
    titleKeywords,
  };
}

function parseStoredFacets(raw: string): GovernanceFindingsQueueFacetsResolved | null {
  let parsed: unknown;

  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }

  if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
    return null;
  }

  const record = parsed as Record<string, unknown>;

  if (!isRiskRegisterFilter(record.registerFilter)) {
    return null;
  }

  const jobView = record.jobView === undefined ? DEFAULT_FINDING_JOB_VIEW : record.jobView;

  if (!isFindingJobView(jobView)) {
    return null;
  }

  let nlFacets: FindingsNaturalLanguageFacets = EMPTY_FINDINGS_NATURAL_LANGUAGE_FACETS;

  if (record.nlFacets !== undefined) {
    const parsedNl = parseNlFacets(record.nlFacets);

    if (parsedNl === null) {
      return null;
    }

    nlFacets = parsedNl;
  }

  return {
    registerFilter: record.registerFilter,
    jobView,
    nlFacets,
  };
}

export function readGovernanceFindingsQueueFacets(
  mode: GovernanceFindingsQueueMode = "tenant",
): GovernanceFindingsQueueFacetsResolved {
  if (typeof window === "undefined") {
    return { ...DEFAULT_GOVERNANCE_FINDINGS_QUEUE_FACETS };
  }

  try {
    const raw = window.localStorage.getItem(storageKeyForMode(mode));

    if (raw === null) {
      return { ...DEFAULT_GOVERNANCE_FINDINGS_QUEUE_FACETS };
    }

    const parsed = parseStoredFacets(raw);

    if (parsed === null) {
      return { ...DEFAULT_GOVERNANCE_FINDINGS_QUEUE_FACETS };
    }

    return parsed;
  } catch {
    return { ...DEFAULT_GOVERNANCE_FINDINGS_QUEUE_FACETS };
  }
}

export function writeGovernanceFindingsQueueFacets(
  facets: GovernanceFindingsQueueFacetsV1,
  mode: GovernanceFindingsQueueMode = "tenant",
): void {
  if (typeof window === "undefined") {
    return;
  }

  if (!isRiskRegisterFilter(facets.registerFilter)) {
    return;
  }

  const payload: GovernanceFindingsQueueFacetsV1 = {
    registerFilter: facets.registerFilter,
  };

  if (facets.jobView !== undefined) {
    if (!isFindingJobView(facets.jobView)) {
      return;
    }

    payload.jobView = facets.jobView;
  }

  if (facets.nlFacets !== undefined) {
    payload.nlFacets = facets.nlFacets;
  }

  try {
    window.localStorage.setItem(storageKeyForMode(mode), JSON.stringify(payload));
  } catch {
    // localStorage may be unavailable (e.g. private browsing with storage blocked)
  }
}

/** Merges a partial update with the current stored facets, then writes. */
export function patchGovernanceFindingsQueueFacets(
  partial: Partial<GovernanceFindingsQueueFacetsV1>,
  mode: GovernanceFindingsQueueMode = "tenant",
): void {
  const current = readGovernanceFindingsQueueFacets(mode);

  writeGovernanceFindingsQueueFacets(
    {
      registerFilter: partial.registerFilter ?? current.registerFilter,
      jobView: partial.jobView ?? current.jobView,
      nlFacets: partial.nlFacets ?? current.nlFacets,
    },
    mode,
  );
}

export function clearGovernanceFindingsQueueFacets(mode: GovernanceFindingsQueueMode = "tenant"): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.removeItem(storageKeyForMode(mode));
  } catch {
    // localStorage may be unavailable (e.g. private browsing with storage blocked)
  }
}
