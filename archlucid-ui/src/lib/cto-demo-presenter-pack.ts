import { readBuyerCtoDemoTourActive } from "@/lib/buyer/buyer-cto-demo-tour";
import {
  isBuyerPolishedOperatorShellEnv,
  isBuyerVocabularyPassActive,
  isNextPublicDemoMode,
  isOperatorExperienceFullShellEnv,
} from "@/lib/demo-ui-env";
import { isStaticDemoPayloadFallbackEnabled } from "@/lib/operator/operator-static-demo";

function isCtoDemoNavExpandedEnvFlag(): boolean {
  return (
    process.env.NEXT_PUBLIC_CTO_DEMO_NAV_EXPANDED === "true" ||
    process.env.NEXT_PUBLIC_CTO_DEMO_NAV_EXPANDED === "1"
  );
}

function isCtoDemoOperatorControlsEnvFlag(): boolean {
  const raw = (process.env.NEXT_PUBLIC_CTO_DEMO_OPERATOR_CONTROLS ?? "").trim().toLowerCase();

  return raw === "true" || raw === "1";
}

/** Explicit demo packaging — `NEXT_PUBLIC_DEMO_MODE` or static operator build. */
export function isCtoDemoPackEnv(): boolean {
  return isNextPublicDemoMode() || isStaticDemoPayloadFallbackEnabled();
}

/** Presenter safe mode (#10) — buyer-polished shell in packaged demo builds. */
export function isCtoDemoPresenterSafeModeEnv(): boolean {
  return isBuyerPolishedOperatorShellEnv() && isCtoDemoPackEnv();
}

/**
 * Run-of-show downloads, reset-demo, and similar presenter scaffolding are internal demo-operator
 * tooling and must not surface on buyer-facing Overview. Opt in via
 * `NEXT_PUBLIC_CTO_DEMO_OPERATOR_CONTROLS`, packaged demo + full-operator builds, or local development.
 */
export function isCtoDemoOperatorToolingEnv(): boolean {
  if (isCtoDemoOperatorControlsEnvFlag()) {
    return true;
  }

  if (process.env.NODE_ENV === "development") {
    return true;
  }

  if (isCtoDemoPackEnv() && isOperatorExperienceFullShellEnv()) {
    return true;
  }

  return false;
}

/**
 * Stricter gate for run-of-show downloads and reset-demo — never enabled by `NODE_ENV` alone.
 * Buyer-facing Overview may show {@link isCtoDemoOperatorToolingEnv} readiness recheck without these controls.
 */
export function isCtoDemoInternalOperatorControlsEnv(): boolean {
  if (isCtoDemoOperatorControlsEnvFlag()) {
    return true;
  }

  if (isCtoDemoPackEnv() && isOperatorExperienceFullShellEnv()) {
    return true;
  }

  return false;
}

/** Redirect operator home to the showcase sponsor report (#4). */
export function isCtoDemoSponsorLandingEnv(): boolean {
  return isCtoDemoPresenterSafeModeEnv();
}

/** Expand Graph / Governance / Audit in primary nav without progressive disclosure (#8). */
export function isCtoDemoNavExpandedEnv(): boolean {
  if (!isBuyerPolishedOperatorShellEnv()) {
    return false;
  }

  if (isCtoDemoNavExpandedEnvFlag()) {
    return true;
  }

  // Runtime: presenter clicked Start CTO demo (localStorage) — generic DEMO_MODE alone must not expand nav.
  return readBuyerCtoDemoTourActive();
}

/** @deprecated Prefer {@link isBuyerVocabularyPassActive} — vocabulary is production-wide since TB-645. */
export function isCtoDemoVocabularyPassEnv(): boolean {
  return isBuyerVocabularyPassActive();
}
