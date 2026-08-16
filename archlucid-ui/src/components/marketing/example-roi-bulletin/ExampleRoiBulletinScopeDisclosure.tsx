import type { ReactNode } from "react";

import { EXAMPLE_ROI_BULLETIN_SCOPE_DISCLOSURE_BODY } from "@/lib/example-roi-bulletin-evidence-copy";
import { TRUST_CENTER_PUBLIC_LAYOUT } from "@/lib/trust-center-public-layout";
import { cn } from "@/lib/utils";

/** Demoted scope boundary — what this marketing sample does not replace. */
export function ExampleRoiBulletinScopeDisclosure(): ReactNode {
  return (
    <details
      className={TRUST_CENTER_PUBLIC_LAYOUT.vocabularyDisclosure}
      data-testid="example-roi-bulletin-scope-disclosure"
    >
      <summary className={TRUST_CENTER_PUBLIC_LAYOUT.vocabularySummary}>What this page is not</summary>
      <div className={TRUST_CENTER_PUBLIC_LAYOUT.vocabularyBody}>
        <p className={cn("m-0 text-al-text-secondary", TRUST_CENTER_PUBLIC_LAYOUT.vocabularyIntro)}>
          {EXAMPLE_ROI_BULLETIN_SCOPE_DISCLOSURE_BODY}
        </p>
      </div>
    </details>
  );
}
