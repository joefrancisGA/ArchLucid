import {
  isBuyerSafeDemoMarketingChromeEnv,
  isNextPublicDemoMode,
} from "@/lib/demo-ui-env";
import { readFrictionlessTrialSessionEnabled } from "@/lib/frictionless-trial-session";
import { isStaticDemoPayloadFallbackEnabled } from "@/lib/operator/operator-static-demo";
import { isWorkingWorkspaceMode, type WorkspaceModeId } from "@/lib/workspace-mode/workspace-mode";

export type ResolveArchitectWorkspaceChromeInput = {
  readonly workspaceMode: WorkspaceModeId;
  readonly staticDemoFallback?: boolean;
  readonly demoMarketingChrome?: boolean;
  readonly frictionlessTrial?: boolean;
};

/**
 * Dense architect-workspace chrome (shortcut chips, nav metadata) for Working seats on production builds.
 * Demo, static fallback, and frictionless trial sessions stay buyer-polished.
 */
export function resolveArchitectWorkspaceChrome(input: ResolveArchitectWorkspaceChromeInput): boolean {
  if (!isWorkingWorkspaceMode(input.workspaceMode)) {
    return false;
  }

  if (input.staticDemoFallback ?? isStaticDemoPayloadFallbackEnabled()) {
    return false;
  }

  if (input.demoMarketingChrome ?? isBuyerSafeDemoMarketingChromeEnv()) {
    return false;
  }

  if (input.frictionlessTrial ?? readFrictionlessTrialSessionEnabled()) {
    return false;
  }

  if (isNextPublicDemoMode()) {
    return false;
  }

  return true;
}
