"use client";

import dynamic from "next/dynamic";

export const DraftIntakeDecisionReceiptCard = dynamic(
  () =>
    import("@/components/draft-intake/DraftIntakeDecisionReceiptCard").then(
      (module) => module.DraftIntakeDecisionReceiptCard,
    ),
  { loading: () => null },
);

export const SocraticIntakeWizardAdvancedRail = dynamic(
  () => import("./SocraticIntakeWizardAdvancedRail").then((module) => module.SocraticIntakeWizardAdvancedRail),
  { loading: () => null },
);
