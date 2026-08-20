"use client";

import type { JSX } from "react";

import { PairwiseVocabularyRailFromModel } from "@/components/vocabulary/PairwiseVocabularyRailFromModel";
import {
  buildAccountSecurityAuthDomainsPairwiseRail,
  type AccountSecurityAuthDomainsSurfaceId,
  type AccountSecurityAuthDomainsVocabularyModel,
} from "@/lib/vocabulary/account-security-auth-domains-vocabulary";

export type AccountSecurityAuthDomainsVocabularyRailProps = {
  readonly currentSurfaceId: AccountSecurityAuthDomainsSurfaceId;
  readonly variant?: "compact" | "full";
  readonly className?: string;
  readonly model?: AccountSecurityAuthDomainsVocabularyModel;
};

/** TB-2293 — Account security sign-in methods vs tenant Sign-in domains. */
export function AccountSecurityAuthDomainsVocabularyRail(
  props: AccountSecurityAuthDomainsVocabularyRailProps,
): JSX.Element {
  const pairwiseModel =
    props.model !== undefined
      ? {
          heading: props.model.heading,
          whyTwo: props.model.whyTwo,
          compactLine: props.model.compactLine,
          currentLink: props.model.accountSecurityLink,
          peerLink: props.model.authDomainsLink,
        }
      : buildAccountSecurityAuthDomainsPairwiseRail();

  return (
    <PairwiseVocabularyRailFromModel
      testIdPrefix="account-security-auth-domains-vocabulary"
      currentSurfaceId={props.currentSurfaceId}
      variant={props.variant}
      className={props.className}
      compactLinkPlacement="inline"
      model={pairwiseModel}
    />
  );
}
