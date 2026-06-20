"use client";

import dynamic from "next/dynamic";

const OperatorHomeAdvancedGuidanceSection = dynamic(
  () =>
    import("@/components/operator-home/OperatorHomeAdvancedGuidanceSection").then(
      (module) => module.OperatorHomeAdvancedGuidanceSection,
    ),
  { loading: () => null, ssr: false },
);

type OperatorHomeAdvancedGuidancePanelProps = {
  readonly buyerPolishedShell: boolean;
  readonly fullOperatorShell?: boolean;
  readonly checklistVariant?: "full" | "compact";
};

/** Collapsed onboarding rail — deferred because it sits below the fold on operator home. */
export function OperatorHomeAdvancedGuidancePanel(props: OperatorHomeAdvancedGuidancePanelProps) {
  return <OperatorHomeAdvancedGuidanceSection {...props} />;
}
