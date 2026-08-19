import type { ReactNode } from "react";

import { COMPLIANCE_JOURNEY_SCOPE_DISCLOSURE_BODY } from "@/lib/compliance-journey-evidence-copy";
import { TRUST_CENTER_PUBLIC_LAYOUT } from "@/lib/trust-center-public-layout";
import { cn } from "@/lib/utils";

/** Demoted scope boundary — what this marketing page does not replace. */
export function ComplianceJourneyScopeDisclosure(): ReactNode {
  return (
    <details
      className={TRUST_CENTER_PUBLIC_LAYOUT.vocabularyDisclosure}
      data-testid="compliance-journey-scope-disclosure"
    >
      <summary className={TRUST_CENTER_PUBLIC_LAYOUT.vocabularySummary}>What this page is not</summary>
      <div className={TRUST_CENTER_PUBLIC_LAYOUT.vocabularyBody}>
        <p className={cn("m-0 text-al-text-secondary", TRUST_CENTER_PUBLIC_LAYOUT.vocabularyIntro)}>
          {COMPLIANCE_JOURNEY_SCOPE_DISCLOSURE_BODY}
        </p>
      </div>
    </details>
  );
}
