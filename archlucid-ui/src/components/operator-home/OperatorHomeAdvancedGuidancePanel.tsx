"use client";

import { createDeferredComponentFromManifest } from "@/lib/operator/load-deferred-chunk-from-manifest";

const OperatorHomeAdvancedGuidanceSectionDeferred = createDeferredComponentFromManifest(
  "operator-home-advanced-guidance",
  { suppressLoading: true },
);

type OperatorHomeAdvancedGuidancePanelProps = {
  readonly buyerPolishedShell: boolean;
  readonly fullOperatorShell?: boolean;
  readonly checklistVariant?: "full" | "compact";
};

/** Collapsed onboarding rail — deferred because it sits below the fold on operator home. */
export function OperatorHomeAdvancedGuidancePanel(props: OperatorHomeAdvancedGuidancePanelProps) {
  return <OperatorHomeAdvancedGuidanceSectionDeferred {...props} />;
}
