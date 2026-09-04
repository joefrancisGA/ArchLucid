"use client";

import { PolicyPacksPageView } from "./PolicyPacksPageView";
import type { PolicyPacksPageServerLoad } from "./load-policy-packs-page-data";
import { usePolicyPacksPage } from "./use-policy-packs-page";
import {
  LivelihoodDocumentGuardDialog,
  useLivelihoodDocumentGuards,
} from "@/hooks/use-livelihood-document-guards";
import { policyPackAuthoringHasUnsavedEdits } from "./policy-pack-authoring-unsaved";

type PolicyPacksPageClientProps = {
  readonly loaded: PolicyPacksPageServerLoad;
};

export function PolicyPacksPageClient(props: PolicyPacksPageClientProps) {
  const model = usePolicyPacksPage(props.loaded);
  const hasUnsavedEdits = policyPackAuthoringHasUnsavedEdits({
    createJson: model.createJson,
    name: model.name,
    description: model.description,
    packType: model.packType,
    publishJson: model.publishJson,
    publishBaselineJson: model.publishBaselineJson,
    selectedPackId: model.selectedPackId,
  });
  const documentGuards = useLivelihoodDocumentGuards({ when: hasUnsavedEdits });

  return (
    <>
      <PolicyPacksPageView model={model} />
      <LivelihoodDocumentGuardDialog
        open={documentGuards.dialogOpen}
        message={documentGuards.dialogMessage}
        onConfirmLeave={documentGuards.confirmLeave}
        onCancelLeave={documentGuards.cancelLeave}
      />
    </>
  );
}
