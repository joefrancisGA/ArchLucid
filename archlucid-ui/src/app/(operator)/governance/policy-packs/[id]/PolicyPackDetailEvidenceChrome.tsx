"use client";

import type { ReactNode } from "react";

import { LayerHeader } from "@/components/LayerHeader";
import { OperatorPageContainer } from "@/components/operator/OperatorPageContainer";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";
import {
  POLICY_PACK_DETAIL_BUYER_START_HERE_HELPER,
  POLICY_PACK_DETAIL_PAGE_LEAD,
  POLICY_PACK_DETAIL_PRIMARY_CONTENT_ID,
  POLICY_PACK_DETAIL_SKIP_LINK_LABEL,
} from "@/lib/policy/policy-pack-detail-page-copy";
import { cn } from "@/lib/utils";

import { PolicyPackDetailBuyerChrome } from "./PolicyPackDetailBuyerChrome";

type PolicyPackDetailEvidenceChromeProps = {
  readonly children: ReactNode;
};

/** Shared Evidence chrome for policy pack detail variants (GPI). */
export function PolicyPackDetailEvidenceChrome(
  props: PolicyPackDetailEvidenceChromeProps,
): React.JSX.Element {
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();

  return (
    <div data-testid="policy-pack-detail-evidence-chrome">
      {buyerPolishedShell ? (
        <a
          href={`#${POLICY_PACK_DETAIL_PRIMARY_CONTENT_ID}`}
          className={HELP_PAGE_LAYOUT.technicalReferenceSkipLink}
        >
          {POLICY_PACK_DETAIL_SKIP_LINK_LABEL}
        </a>
      ) : null}

      {buyerPolishedShell ? (
        <LayerHeader pageKey="policy-packs" density="compact" className="mb-3 px-4" />
      ) : null}

      <OperatorPageContainer variant={buyerPolishedShell ? "workflow" : "dashboard"} className="pt-4">
        <div className="flex justify-end px-4">
          <PageContextualHelpButton />
        </div>
      </OperatorPageContainer>
      <div
        id={POLICY_PACK_DETAIL_PRIMARY_CONTENT_ID}
        className="scroll-mt-24"
        data-testid="policy-pack-detail-primary-content"
      >
        {buyerPolishedShell ? (
          <div
            className="space-y-4 border-b border-neutral-200 px-4 pb-6 dark:border-neutral-800"
            data-testid="governance-policy-pack-detail-first-viewport"
          >
            <p
              className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}
              data-testid="governance-policy-pack-detail-intro"
            >
              {POLICY_PACK_DETAIL_PAGE_LEAD}
            </p>
            <p
              className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
              data-testid="governance-policy-pack-detail-buyer-start-here-helper"
            >
              {POLICY_PACK_DETAIL_BUYER_START_HERE_HELPER}
            </p>
          </div>
        ) : null}
        {props.children}
        {buyerPolishedShell ? <PolicyPackDetailBuyerChrome /> : null}
      </div>
    </div>
  );
}
