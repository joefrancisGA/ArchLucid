import { deriveRunListPipelineLabel } from "@/components/RunStatusBadge";
import type { RunSummary } from "@/types/authority";

import { FIRST_PILOT_OPERATING_RAIL_STEP_COUNT } from "./first-pilot-operating-rail-steps";

export type FirstPilotOperatingRailStepStatus = "complete" | "current" | "upcoming" | "attention";

export type FirstPilotOperatingRailSignals = {
  /** API readiness acceptable for pilot work (healthy or degraded, not unhealthy). */
  setupReady: boolean;
  /** Readiness explicitly unhealthy — surface troubleshooting. */
  setupUnhealthy: boolean;
  /** Context ingested on a run, sample path used, or review already committed. */
  evidenceReady: boolean;
  hasAnyRun: boolean;
  readyToFinalize: boolean;
  hasCommittedManifest: boolean;
  latestRunId: string | null;
  firstCommittedRunId: string | null;
};

export type FirstPilotOperatingRailResolvedStep = {
  status: FirstPilotOperatingRailStepStatus;
  primaryHref: string;
};

const EVIDENCE_ACK_STORAGE_KEY = "archlucid_first_pilot_evidence_ack_v1";
const DEFERRED_BUYER_REQUIREMENTS_STORAGE_KEY = "archlucid_first_pilot_deferred_buyer_requirements_v1";

/** Optional operator acknowledgement when using sample-only evidence (no extractor upload). */
export function writeFirstPilotEvidenceAcknowledged(): void {
  try {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(EVIDENCE_ACK_STORAGE_KEY, "1");
    }
  } catch {
    /* private mode */
  }
}

export function readFirstPilotEvidenceAcknowledged(): boolean {
  try {
    return typeof window !== "undefined" && window.localStorage.getItem(EVIDENCE_ACK_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

/** Records buyer requirements explicitly deferred to V1.1/V2/(B) for sponsor disposition (cockpit only). */
export function writeFirstPilotDeferredBuyerRequirements(requirements: readonly string[]): void {
  try {
    if (typeof window === "undefined")
      return;

    const normalized = requirements.map((item) => item.trim()).filter((item) => item.length > 0);

    if (normalized.length === 0) {
      window.localStorage.removeItem(DEFERRED_BUYER_REQUIREMENTS_STORAGE_KEY);

      return;
    }

    window.localStorage.setItem(DEFERRED_BUYER_REQUIREMENTS_STORAGE_KEY, JSON.stringify(normalized));
  } catch {
    /* private mode */
  }
}

export function readFirstPilotDeferredBuyerRequirements(): string[] {
  try {
    if (typeof window === "undefined")
      return [];

    const raw = window.localStorage.getItem(DEFERRED_BUYER_REQUIREMENTS_STORAGE_KEY);

    if (raw === null || raw.trim().length === 0)
      return [];

    const parsed: unknown = JSON.parse(raw);

    if (!Array.isArray(parsed))
      return [];

    return parsed.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
  } catch {
    return [];
  }
}

function isSetupComplete(signals: FirstPilotOperatingRailSignals): boolean {
  return signals.setupReady === true;
}

function isEvidenceComplete(signals: FirstPilotOperatingRailSignals): boolean {
  return signals.evidenceReady === true;
}

function isCreateComplete(signals: FirstPilotOperatingRailSignals): boolean {
  return signals.hasAnyRun === true;
}

function isExecuteComplete(signals: FirstPilotOperatingRailSignals): boolean {
  return signals.readyToFinalize === true || signals.hasCommittedManifest === true;
}

function isFinalizeComplete(signals: FirstPilotOperatingRailSignals): boolean {
  return signals.hasCommittedManifest === true;
}

function isSponsorComplete(signals: FirstPilotOperatingRailSignals): boolean {
  return signals.hasCommittedManifest === true;
}

const STEP_COMPLETE_CHECKS: readonly ((signals: FirstPilotOperatingRailSignals) => boolean)[] = [
  isSetupComplete,
  isEvidenceComplete,
  isCreateComplete,
  isExecuteComplete,
  isFinalizeComplete,
  isSponsorComplete,
];

function hrefForStepIndex(index: number, signals: FirstPilotOperatingRailSignals): string {
  if (index === 3 || index === 4 || index === 5) {
    const runId = signals.latestRunId ?? signals.firstCommittedRunId;

    if (runId !== null && runId.length > 0) {
      return `/reviews/${encodeURIComponent(runId)}`;
    }
  }

  if (index === 5 && signals.firstCommittedRunId !== null) {
    return `/reviews/${encodeURIComponent(signals.firstCommittedRunId)}`;
  }

  const step = FIRST_PILOT_OPERATING_RAIL_STEPS_FALLBACK_HREFS[index];

  return step;
}

/** Static hrefs when no run id is available yet (indices align with operating-rail steps). */
const FIRST_PILOT_OPERATING_RAIL_STEPS_FALLBACK_HREFS: readonly string[] = [
  "/health",
  "/settings/extract-upload",
  "/reviews/new",
  "/reviews?projectId=default",
  "/reviews?projectId=default",
  "/reviews?projectId=default",
];

/**
 * Derives per-step status from platform signals (no manual checkboxes).
 * First incomplete step is `current`; earlier steps are `complete`; later are `upcoming`.
 */
export function resolveFirstPilotOperatingRailSteps(
  signals: FirstPilotOperatingRailSignals,
): FirstPilotOperatingRailResolvedStep[] {
  const completeFlags = STEP_COMPLETE_CHECKS.map((check) => check(signals));
  const firstIncomplete = completeFlags.findIndex((done) => !done);
  const activeIndex = firstIncomplete < 0 ? FIRST_PILOT_OPERATING_RAIL_STEP_COUNT - 1 : firstIncomplete;

  return completeFlags.map((done, index) => {
    let status: FirstPilotOperatingRailStepStatus;

    if (index === 0 && signals.setupUnhealthy === true && !done) {
      status = "attention";
    } else if (done) {
      status = "complete";
    } else if (index === activeIndex) {
      status = "current";
    } else {
      status = "upcoming";
    }

    return {
      status,
      primaryHref: hrefForStepIndex(index, signals),
    };
  });
}

/** Builds rail signals from health readiness, run list, and optional evidence acknowledgement. */
export function buildFirstPilotOperatingRailSignals(input: {
  healthStatus: string | null;
  runs: readonly RunSummary[];
  evidenceAcknowledged: boolean;
  hasCommittedManifest: boolean;
  latestRunId: string | null;
  firstCommittedRunId: string | null;
}): FirstPilotOperatingRailSignals {
  const normalizedHealth = input.healthStatus?.trim().toLowerCase() ?? "";
  const setupUnhealthy =
    normalizedHealth.includes("unhealthy") ||
    normalizedHealth.includes("down") ||
    normalizedHealth.includes("fail");
  const setupReady =
    !setupUnhealthy &&
    (normalizedHealth.includes("healthy") ||
      normalizedHealth.includes("degraded") ||
      normalizedHealth.includes("warn") ||
      input.runs.length > 0);

  const evidenceOnRun =
    input.runs.some((r) => r.hasContextSnapshot === true || r.hasGraphSnapshot === true) ||
    input.hasCommittedManifest;
  const evidenceReady = evidenceOnRun || input.evidenceAcknowledged;

  return {
    setupReady,
    setupUnhealthy,
    evidenceReady,
    hasAnyRun: input.runs.length > 0,
    readyToFinalize: input.runs.some((r) => deriveRunListPipelineLabel(r) === "Ready to finalize"),
    hasCommittedManifest: input.hasCommittedManifest,
    latestRunId: input.latestRunId,
    firstCommittedRunId: input.firstCommittedRunId,
  };
}
