import { buildRunDetailPresentation } from "./run-detail-page-presentation";
import type { RunDetailPageModel } from "./run-detail-page-model";
import {
  resolveRunDetailPageViewChrome,
  RunDetailPageViewShell,
} from "./RunDetailPageViewShell";

/** Server component: renders the main run detail chrome from a preloaded `RunDetailPageModel`. */
export async function RunDetailPageView(props: {
  readonly model: RunDetailPageModel;
  readonly fromArchitectureCreation?: boolean;
}): Promise<React.JSX.Element> {
  const presentation = await buildRunDetailPresentation(
    props.model,
    props.fromArchitectureCreation === true,
  );
  const chrome = resolveRunDetailPageViewChrome(props.model, presentation);

  return (
    <RunDetailPageViewShell
      model={props.model}
      presentation={presentation}
      chrome={chrome}
    />
  );
}
