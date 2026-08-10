"use client";

import {
  RunDetailWorkspaceSummaryStrip,
  type RunDetailWorkspaceSummaryStripProps,
} from "./RunDetailWorkspaceChrome";

/** Deferred-import wrapper — findings deep links live in the blocking banner and primary CTA. */
export function RunDetailWorkspaceSummaryStripTabAware(
  props: RunDetailWorkspaceSummaryStripProps,
): React.JSX.Element {
  return <RunDetailWorkspaceSummaryStrip {...props} />;
}
