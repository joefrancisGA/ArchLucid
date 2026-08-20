"use client";

import type { JSX } from "react";

import {
  buildAccountSecurityAuthDomainsVocabulary,
  resolveAccountSecurityAuthDomainsPeerLink,
  type AccountSecurityAuthDomainsSurfaceId,
  type AccountSecurityAuthDomainsVocabularyModel,
} from "@/lib/vocabulary/account-security-auth-domains-vocabulary";
import { VocabularyRail } from "@/components/vocabulary/VocabularyRail";

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
  const model = props.model ?? buildAccountSecurityAuthDomainsVocabulary();
  const peer = resolveAccountSecurityAuthDomainsPeerLink(props.currentSurfaceId);
  const currentLink =
    props.currentSurfaceId === "account-security"
      ? model.accountSecurityLink
      : model.authDomainsLink;

  return (
    <VocabularyRail
      testIdPrefix="account-security-auth-domains-vocabulary"
      currentSurfaceId={props.currentSurfaceId}
      variant={props.variant}
      className={props.className}
      compactLine={model.compactLine}
      compactLinkPlacement="inline"
      heading={model.heading}
      whyTwo={model.whyTwo}
      currentLabel={currentLink.label}
      links={[{ ...peer, testIdSuffix: "peer-link" }]}
    />
  );
}
