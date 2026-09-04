import {
  resolveArchitectWorkspaceChrome,
  type ResolveArchitectWorkspaceChromeInput,
} from "@/lib/architect-workspace-chrome";
import { DEFAULT_WORKSPACE_MODE, type WorkspaceModeId } from "@/lib/workspace-mode/workspace-mode";

export type ResolveProductionDeskChromeInput = ResolveArchitectWorkspaceChromeInput;

/**
 * True when the authenticated seat should see dense working-desk chrome (not eval/demo teaching).
 * Production Working tenants default here without `NEXT_PUBLIC_OPERATOR_EXPERIENCE=operator`.
 */
export function resolveProductionDeskChrome(input: ResolveProductionDeskChromeInput): boolean {
  return resolveArchitectWorkspaceChrome(input);
}

/**
 * True when eval/demo teaching chrome should drive operator surfaces (Guided, demo, trial, static showcase).
 * Use this instead of {@link isBuyerPolishedOperatorShellEnv} alone — production Guided seats are eval chrome
 * even though buyer-polished env is false (WD-01).
 */
export function resolveProductionEvalChrome(input: ResolveProductionDeskChromeInput): boolean {
  return !resolveProductionDeskChrome(input);
}

/**
 * Server/RSC eval-chrome gate when workspace mode is not yet hydrated.
 * Defaults to Working; demo/trial/static flags still flow through architect-workspace chrome.
 */
export function resolveProductionEvalChromeForServer(
  workspaceMode: WorkspaceModeId = DEFAULT_WORKSPACE_MODE,
): boolean {
  return resolveProductionEvalChrome({ workspaceMode });
}
