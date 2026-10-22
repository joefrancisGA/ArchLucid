export const PRIVACY_POLICY_PAGE_TITLE = "Privacy Policy" as const;

export const PRIVACY_POLICY_PAGE_LEDE_OPERATOR =
  "How ArchLucid collects, uses, shares, retains, and protects personal information for website visitors and product users.";

export const PRIVACY_POLICY_PAGE_LEDE_BUYER =
  "How we handle personal data for visitors and product users — read the summary or the full policy below.";

export const PRIVACY_POLICY_BREADCRUMB_HUB_LABEL = "Trust Center" as const;

export const PRIVACY_POLICY_BREADCRUMB_TOPIC_TITLE = "Privacy Policy" as const;

export function privacyPolicyPageLede(buyerPolishedShell: boolean): string {
  return buyerPolishedShell ? PRIVACY_POLICY_PAGE_LEDE_BUYER : PRIVACY_POLICY_PAGE_LEDE_OPERATOR;
}
