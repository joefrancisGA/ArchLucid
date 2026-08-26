"use client";

import { ArchitectureScopeUnderstandingCheckPanel } from "@/components/architecture/ArchitectureScopeUnderstandingCheckPanel";
import { GUIDED_INTAKE_ARCHITECTURE_CONTEXT_LABEL } from "@/lib/guided-intake-copy";

import type { FirstPilotIntakeWizardState } from "./use-first-pilot-intake-wizard";

type FirstPilotIntakeScopeGateProps = {
  readonly wizard: FirstPilotIntakeWizardState;
};

export function FirstPilotIntakeScopeGate(props: FirstPilotIntakeScopeGateProps): React.JSX.Element {
  const { wizard } = props;

  return (
    <ArchitectureScopeUnderstandingCheckPanel
      input={wizard.scopeUnderstandingInput}
      contextSourceLabel={`${GUIDED_INTAKE_ARCHITECTURE_CONTEXT_LABEL} above`}
      disabled={wizard.creationProgress.isActive || wizard.blocksLlmExecution}
      onBulletsChange={wizard.setScopeBullets}
      onGateChange={wizard.setScopeGateOpen}
    />
  );
}
