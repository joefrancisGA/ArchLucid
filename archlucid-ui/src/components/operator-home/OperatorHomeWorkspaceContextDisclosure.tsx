"use client";

import type { ReactElement } from "react";

import { AdvancedOptionsAccordion } from "@/components/AdvancedOptionsAccordion";

import { OperatorHomeDeltaPanel, OperatorHomeWorkspaceStatusPanel } from "./OperatorHomeDeferredPanels";

type OperatorHomeWorkspaceContextDisclosureProps = {
  readonly showWorkspaceStatus: boolean;
};

/** Pilot home: delta trends and workspace status default closed below recent reviews. */
export function OperatorHomeWorkspaceContextDisclosure(
  props: OperatorHomeWorkspaceContextDisclosureProps,
): ReactElement {
  return (
    <div data-testid="operator-home-workspace-context">
      <AdvancedOptionsAccordion triggerLabel="Workspace metrics and status" defaultOpen={false}>
        <div className="space-y-4">
          <OperatorHomeDeltaPanel />
          {props.showWorkspaceStatus ? <OperatorHomeWorkspaceStatusPanel /> : null}
        </div>
      </AdvancedOptionsAccordion>
    </div>
  );
}
