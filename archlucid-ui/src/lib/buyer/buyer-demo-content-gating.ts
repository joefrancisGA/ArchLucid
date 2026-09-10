import {
  isBuyerPolishedOperatorShellEnv,
  isNextPublicDemoMode,
} from "@/lib/demo-ui-env";
import { isOperatorDemoStaticMode } from "@/lib/operator/operator-static-demo";

/**
 * Curated static demo rows, marketing banners, and demo-run picker merges are allowed only when an explicit
 * demo/static-operator build flag is set — not merely because the default shell is buyer-polished (TB-273 / BDA-024).
 */
export function isExplicitStaticDemoMarketingBuild(): boolean {
  return isNextPublicDemoMode() || isOperatorDemoStaticMode();
}

/**
 * Operator demo chrome (Demonstration workspace banner, sample review summary disclaimers) may render for a static
 * demo run only when demo marketing is explicitly enabled, or when the shell is not buyer-polished (operator build).
 */
export function shouldShowOperatorDemoMarketingChrome(
  buyerPolishedArtifactTable: boolean,
  usedStaticDemoRun: boolean,
): boolean {
  if (!usedStaticDemoRun) {
    return false;
  }

  if (!buyerPolishedArtifactTable) {
    return true;
  }

  return isExplicitStaticDemoMarketingBuild();
}

/**
 * Picker/export paths may merge curated demo runs after empty API responses only in explicit demo builds (BDA-017).
 */
export function shouldMergeDemoRunsIntoProjectPicker(options?: { readonly mergeDemoOnEmpty?: boolean }): boolean {
  if (options?.mergeDemoOnEmpty === false) {
    return false;
  }

  if (options?.mergeDemoOnEmpty === true) {
    return true;
  }

  return isExplicitStaticDemoMarketingBuild();
}

/**
 * Policy findings queue may short-circuit to the curated PHI/decision spine only in explicit demo builds (BDA-004).
 */
export function shouldUseGovernanceCuratedDemoSpine(): boolean {
  return isExplicitStaticDemoMarketingBuild();
}

/**
 * Fail-closed coherence: full-operator shell is an explicit internal opt-in; buyer-polished vocabulary remains the
 * default even when {@link isOperatorExperienceFullShellEnv} is true (TB-643).
 */
export function assertBuyerPolishedBuildEnvCoherence(): void {
  if (process.env.NODE_ENV !== "production") {
    return;
  }

  if (process.env.NEXT_PUBLIC_OPERATOR_EXPERIENCE === "operator" && !isBuyerPolishedOperatorShellEnv()) {
    throw new Error(
      "Invalid UI env: NEXT_PUBLIC_OPERATOR_EXPERIENCE=operator without buyer-polished shell — demo banners may leak (TB-273 / BDA-024).",
    );
  }
}
