"use client";

import {
  LivelihoodDocumentGuardDialog,
  useLivelihoodDocumentGuards,
} from "@/hooks/use-livelihood-document-guards";

export const REMEDIATION_PATTERN_YAML_UNSAVED_MESSAGE =
  "You have unsaved YAML import text. Leave this page without importing?";

export type RemediationPatternsGuardsProps = {
  readonly yamlDraft: string;
};

/** Document guards for remediation pattern YAML import draft text (LW-081). */
export function RemediationPatternsGuards(props: RemediationPatternsGuardsProps): React.JSX.Element {
  const hasUnsavedEdits = props.yamlDraft.trim().length > 0;
  const documentGuards = useLivelihoodDocumentGuards({
    when: hasUnsavedEdits,
    message: REMEDIATION_PATTERN_YAML_UNSAVED_MESSAGE,
  });

  return (
    <LivelihoodDocumentGuardDialog
      message={documentGuards.dialogMessage}
      onCancelLeave={documentGuards.cancelLeave}
      onConfirmLeave={documentGuards.confirmLeave}
      open={documentGuards.dialogOpen}
    />
  );
}
