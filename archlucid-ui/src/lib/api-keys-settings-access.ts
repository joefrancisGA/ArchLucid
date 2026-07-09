import {
  isBuyerPolishedOperatorShellEnv,
  isNextPublicDemoMode,
  isOperatorExperienceFullShellEnv,
} from "@/lib/demo-ui-env";

/**
 * API key management is an enterprise / full-operator security surface — not buyer-demo or polished retail shell.
 */
export function isApiKeysSettingsSurfaceEnabled(): boolean {
  if (isBuyerPolishedOperatorShellEnv()) {
    return false;
  }

  if (isNextPublicDemoMode()) {
    return false;
  }

  return isOperatorExperienceFullShellEnv();
}
