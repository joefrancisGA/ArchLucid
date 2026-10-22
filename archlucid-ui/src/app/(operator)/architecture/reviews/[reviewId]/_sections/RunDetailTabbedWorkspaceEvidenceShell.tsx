import { composeRunDetailEvidenceTab } from "./RunDetailEvidenceTabComposition";
import type { RunDetailPageModel } from "./run-detail-page-model";
import type { RunDetailPresentation } from "./run-detail-page-presentation";

export type RunDetailTabbedWorkspaceEvidenceShellInput = {
  readonly model: RunDetailPageModel;
  readonly presentation: RunDetailPresentation;
};

/** Composes the evidence tab panel for the tabbed run-detail workspace. */
export function composeRunDetailTabbedWorkspaceEvidenceShell(
  input: RunDetailTabbedWorkspaceEvidenceShellInput,
): React.JSX.Element {
  return composeRunDetailEvidenceTab({ model: input.model, presentation: input.presentation });
}
