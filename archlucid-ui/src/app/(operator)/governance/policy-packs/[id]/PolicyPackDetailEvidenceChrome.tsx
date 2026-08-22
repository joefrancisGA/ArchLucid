"use client";

import type { ReactNode } from "react";

import { OperatorPageContainer } from "@/components/operator/OperatorPageContainer";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";
import {
  POLICY_PACK_DETAIL_PRIMARY_CONTENT_ID,
  POLICY_PACK_DETAIL_SKIP_LINK_LABEL,
} from "@/lib/policy/policy-pack-detail-page-copy";

type PolicyPackDetailEvidenceChromeProps = {
  readonly children: ReactNode;
};

/** Shared Evidence chrome for policy pack detail variants (GPI). */
export function PolicyPackDetailEvidenceChrome(
  props: PolicyPackDetailEvidenceChromeProps,
): React.JSX.Element {
  return (
    <div data-testid="policy-pack-detail-evidence-chrome">
      <a
        href={`#${POLICY_PACK_DETAIL_PRIMARY_CONTENT_ID}`}
        className={HELP_PAGE_LAYOUT.technicalReferenceSkipLink}
      >
        {POLICY_PACK_DETAIL_SKIP_LINK_LABEL}
      </a>
      <OperatorPageContainer variant="dashboard" className="pt-4">
        <div className="flex justify-end">
          <PageContextualHelpButton />
        </div>
      </OperatorPageContainer>
      <div
        id={POLICY_PACK_DETAIL_PRIMARY_CONTENT_ID}
        className="scroll-mt-24"
        data-testid="policy-pack-detail-primary-content"
      >
        {props.children}
      </div>
    </div>
  );
}
