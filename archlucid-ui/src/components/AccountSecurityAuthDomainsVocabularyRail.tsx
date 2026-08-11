"use client";

import type { JSX } from "react";

import Link from "next/link";

import {
  buildAccountSecurityAuthDomainsVocabulary,
  resolveAccountSecurityAuthDomainsPeerLink,
  type AccountSecurityAuthDomainsSurfaceId,
  type AccountSecurityAuthDomainsVocabularyModel,
} from "@/lib/vocabulary/account-security-auth-domains-vocabulary";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

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
  const variant = props.variant ?? "compact";
  const model = props.model ?? buildAccountSecurityAuthDomainsVocabulary();
  const peer = resolveAccountSecurityAuthDomainsPeerLink(props.currentSurfaceId);
  const currentLink =
    props.currentSurfaceId === "account-security"
      ? model.accountSecurityLink
      : model.authDomainsLink;

  if (variant === "compact") {
    return (
      <p
        className={cn(
          "m-0 mb-3 leading-relaxed text-al-text-secondary",
          OPERATOR_TYPOGRAPHY.helper,
          props.className,
        )}
        data-testid="account-security-auth-domains-vocabulary"
        data-variant="compact"
        data-current-surface={props.currentSurfaceId}
      >
        <span>{model.compactLine}</span>{" "}
        <Link
          href={peer.href}
          className={cn(OPERATOR_LINK.inline, "font-medium")}
          data-testid="account-security-auth-domains-vocabulary-peer-link"
        >
          {peer.label}
        </Link>
      </p>
    );
  }

  return (
    <section
      className={cn(
        "mb-3 space-y-2 rounded-md border border-neutral-200 bg-neutral-50/50 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-900/30",
        props.className,
      )}
      aria-labelledby="account-security-auth-domains-vocabulary-heading"
      data-testid="account-security-auth-domains-vocabulary"
      data-variant="full"
      data-current-surface={props.currentSurfaceId}
    >
      <h2
        id="account-security-auth-domains-vocabulary-heading"
        className={cn(OPERATOR_TYPOGRAPHY.helper, "m-0 font-medium text-al-text-primary")}
      >
        {model.heading}
      </h2>
      <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
        {model.whyTwo}
      </p>
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        <span
          className={cn("font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.helper)}
          data-testid="account-security-auth-domains-vocabulary-current"
          aria-current="page"
        >
          {currentLink.label}
        </span>
        <Link
          href={peer.href}
          className={cn(OPERATOR_LINK.inline, OPERATOR_TYPOGRAPHY.helper)}
          data-testid="account-security-auth-domains-vocabulary-peer-link"
        >
          {peer.label}
        </Link>
      </div>
    </section>
  );
}
