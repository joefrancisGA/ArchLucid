"use client";

import type { ReactElement } from "react";

import { OperatorFirstRunWorkflowChecklist } from "./OperatorFirstRunWorkflowChecklist";
import { useOperatorFirstRunWorkflowPanel } from "./use-operator-first-run-workflow-panel";

/**
 * Collapsible first architecture-review checklist. Persists "minimized" in localStorage. Compact for a side column; step actions are
 * outline buttons so they do not compete with the main home CTAs.
 */
export function OperatorFirstRunWorkflowPanel(props: { exploreCompletedOutput?: boolean } = {}): ReactElement {
  const panel = useOperatorFirstRunWorkflowPanel(props);

  return <OperatorFirstRunWorkflowChecklist panel={panel} />;
}
