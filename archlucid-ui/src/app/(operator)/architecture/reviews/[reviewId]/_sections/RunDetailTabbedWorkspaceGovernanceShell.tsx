import { composeRunDetailGovernanceTab } from "./RunDetailGovernanceTabComposition";
import type { RunDetailPageModel } from "./run-detail-page-model";
import type { RunDetailPresentation } from "./run-detail-page-presentation";

export type RunDetailTabbedWorkspaceGovernanceShellInput = {
  readonly model: RunDetailPageModel;
  readonly presentation: RunDetailPresentation;
};

/** Composes the governance / decisions-remediation tab panel for the tabbed run-detail workspace. */
export function composeRunDetailTabbedWorkspaceGovernanceShell(
  input: RunDetailTabbedWorkspaceGovernanceShellInput,
): React.JSX.Element {
  return composeRunDetailGovernanceTab({ model: input.model, presentation: input.presentation });
}
