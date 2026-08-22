import { canonicalizeDemoRunId } from "@/lib/demo-run-canonical";
import { readFrictionlessTrialSessionEnabled } from "@/lib/frictionless-trial-session";
import { isBuyerPolishedOperatorShellEnv, isOperatorExperienceFullShellEnv } from "@/lib/demo-ui-env";
import { isPublicDemoModeEnv } from "@/lib/public-demo-mode";
import {
  CUSTOMER_INTAKE_LATER_COMPARE_RUN_ID,
  CUSTOMER_INTAKE_PRIOR_COMPARE_RUN_ID,
  CUSTOMER_INTAKE_SAMPLE_RUN_ID,
} from "@/lib/samples/customer-intake-modernization/definition";
import { resolveSampleScenarioByManifestId } from "@/lib/samples/registry";
import {
  SHOWCASE_CREATED_STATIC_DEMO_MANIFEST_ID,
  SHOWCASE_CREATED_STATIC_DEMO_RUN_ID,
} from "@/lib/showcase-created-static-demo";
import { SHOWCASE_STATIC_DEMO_MANIFEST_ID, SHOWCASE_STATIC_DEMO_RUN_ID } from "@/lib/showcase-static-demo";

const DEMO_RUN_IDS_FOR_STATIC_FALLBACK = new Set<string>([
  SHOWCASE_STATIC_DEMO_RUN_ID,
  SHOWCASE_CREATED_STATIC_DEMO_RUN_ID,
  CUSTOMER_INTAKE_SAMPLE_RUN_ID,
  CUSTOMER_INTAKE_PRIOR_COMPARE_RUN_ID,
  CUSTOMER_INTAKE_LATER_COMPARE_RUN_ID,
  "claims-intake-modernization-run",
  "claims-intake-run-v1",
  "claims-intake-run-v2",
  "customer-intake-modernization-run",
]);

/** When true, operator run/manifest pages use curated showcase data if the API fails (demo deploys only). */
export function isOperatorDemoStaticMode(): boolean {
  return (
    process.env.NEXT_PUBLIC_DEMO_STATIC_OPERATOR === "true" || process.env.NEXT_PUBLIC_DEMO_STATIC_OPERATOR === "1"
  );
}

export const OPERATOR_DEMO_STATIC_PANIC_STORAGE_KEY = "archlucid.operatorDemo.panicOffline.v1";

/** `window` CustomEvent — presenter forced offline snapshot mode. */
export const ARCHLUCID_CTO_DEMO_PANIC_CHANGED_EVENT = "archlucid-cto-demo-panic-changed";

export function readOperatorDemoPanicOffline(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    return window.localStorage.getItem(OPERATOR_DEMO_STATIC_PANIC_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export function writeOperatorDemoPanicOffline(on: boolean): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    if (on) {
      window.localStorage.setItem(OPERATOR_DEMO_STATIC_PANIC_STORAGE_KEY, "1");
    } else {
      window.localStorage.removeItem(OPERATOR_DEMO_STATIC_PANIC_STORAGE_KEY);
    }
  } catch {
    /* private mode */
  }
}

/** Curated static payloads only when demo/static-operator env flags are set (TB-274 / BE-059). */
export function isPackagedDemoDeployEnv(): boolean {
  return isOperatorDemoStaticMode() || isPublicDemoModeEnv();
}

export const STATIC_DEMO_GOVERNANCE_FALLBACK_STATUS =
  "Showing example approval records — live approval data unavailable. Refresh to reload live data.";

let staticDemoFallbackOutsidePackagedDeployWarned = false;

/** Logs once when frictionless-trial or presenter-offline activates static fallback outside packaged demo hosts. */
export function warnStaticDemoPayloadFallbackOutsidePackagedDeployOnce(): void {
  if (staticDemoFallbackOutsidePackagedDeployWarned) {
    return;
  }

  if (typeof window === "undefined") {
    return;
  }

  if (!isStaticDemoPayloadFallbackEnabled()) {
    return;
  }

  if (isPackagedDemoDeployEnv()) {
    return;
  }

  staticDemoFallbackOutsidePackagedDeployWarned = true;

  console.warn(
    "[ArchLucid] Static demo payload fallback is active outside a packaged demo deploy (frictionless trial or presenter offline mode). Curated payloads must not be treated as live tenant data.",
  );
}

/**
 * Governance approval/promotion seeding is limited to packaged demo deploys so UAT workspaces with
 * transient API failures show empty states instead of example approval records (TB-507).
 * Buyer-polished diligence on known showcase reviews keeps request history aligned with completion messaging.
 */
export function shouldSeedStaticDemoGovernanceRecordsForRun(runId: string): boolean {
  const effectiveRunId = canonicalizeDemoRunId(runId.trim());

  if (!isDemoRunIdEligibleForStaticFallback(effectiveRunId)) {
    return false;
  }

  if (isPackagedDemoDeployEnv()) {
    return isStaticDemoPayloadFallbackEnabled();
  }

  if (isBuyerPolishedOperatorShellEnv()) {
    return true;
  }

  return false;
}

export function isStaticDemoPayloadFallbackEnabled(): boolean {
  if (isOperatorDemoStaticMode() || isPublicDemoModeEnv()) {
    return true;
  }

  if (typeof window !== "undefined" && readFrictionlessTrialSessionEnabled()) {
    return true;
  }

  if (typeof window !== "undefined" && readOperatorDemoPanicOffline()) {
    return true;
  }

  return false;
}

export function isDemoRunIdEligibleForStaticFallback(runId: string): boolean {
  return DEMO_RUN_IDS_FOR_STATIC_FALLBACK.has(runId.trim());
}

function isShowcaseSpineStaticPayloadHostEligible(): boolean {
  if (isStaticDemoPayloadFallbackEnabled()) {
    return true;
  }

  if (!isOperatorExperienceFullShellEnv()) {
    return true;
  }

  if (process.env.NODE_ENV === "development") {
    return true;
  }

  return false;
}

/**
 * Showcase spine static payloads (Claims Intake demo) — active in packaged demo builds and buyer-polished first-run shell.
 */
export function isShowcaseSpineStaticPayloadActiveForRun(runId: string): boolean {
  const effectiveRunId = canonicalizeDemoRunId(runId.trim());

  if (!isDemoRunIdEligibleForStaticFallback(effectiveRunId)) {
    return false;
  }

  return isShowcaseSpineStaticPayloadHostEligible();
}

/** Same trust model as {@link isShowcaseSpineStaticPayloadActiveForRun} for the known showcase manifest UUID. */
export function isShowcaseSpineStaticPayloadActiveForManifest(manifestId: string): boolean {
  const trimmed = manifestId.trim();

  if (trimmed === SHOWCASE_CREATED_STATIC_DEMO_MANIFEST_ID) {
    return isShowcaseSpineStaticPayloadActiveForRun(SHOWCASE_CREATED_STATIC_DEMO_RUN_ID);
  }

  const scenario = resolveSampleScenarioByManifestId(trimmed);

  if (scenario !== null) {
    return isShowcaseSpineStaticPayloadActiveForRun(scenario.runId);
  }

  return false;
}

/** True when demo env is on and the run id is a known showcase token (TB-274 / BE-059). */
export function isStaticDemoPayloadFallbackActiveForRun(runId: string): boolean {
  if (!isStaticDemoPayloadFallbackEnabled()) {
    return false;
  }

  const effectiveRunId = canonicalizeDemoRunId(runId.trim());

  return isDemoRunIdEligibleForStaticFallback(effectiveRunId);
}

/** Same as {@link isStaticDemoPayloadFallbackActiveForRun} for the known showcase manifest UUID. */
export function isStaticDemoPayloadFallbackActiveForManifest(manifestId: string): boolean {
  if (!isStaticDemoPayloadFallbackEnabled()) {
    return false;
  }

  return isShowcaseSpineStaticPayloadActiveForManifest(manifestId);
}
