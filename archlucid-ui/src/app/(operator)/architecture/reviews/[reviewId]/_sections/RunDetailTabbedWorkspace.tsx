import { resolveRunDetailTabbedWorkspace } from "./resolve-run-detail-tabbed-workspace";
import { RunDetailTabbedWorkspaceShell } from "./RunDetailTabbedWorkspaceShell";
import type { RunDetailPresentation } from "./run-detail-page-presentation";
import type { RunDetailPageModel } from "./run-detail-page-model";

export type RunDetailTabbedWorkspaceProps = {
  readonly model: RunDetailPageModel;
  readonly presentation: RunDetailPresentation;
};

/** Tabbed review-detail workspace for the standard (non create-home) run detail layout. */
export function RunDetailTabbedWorkspace(props: RunDetailTabbedWorkspaceProps): React.JSX.Element | null {
  const resolved = resolveRunDetailTabbedWorkspace(props.model, props.presentation);

  if (resolved === null) {
    return null;
  }

  return <RunDetailTabbedWorkspaceShell model={props.model} presentation={props.presentation} resolved={resolved} />;
}
