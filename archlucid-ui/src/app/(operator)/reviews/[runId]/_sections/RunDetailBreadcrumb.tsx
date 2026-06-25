"use client";

import Link from "next/link";

import { useGovernanceMode } from "@/hooks/use-governance-mode";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { OPERATOR_NAV_LINK_LABELS } from "@/lib/i18n";
import { cn } from "@/lib/utils";

type RunDetailBreadcrumbProps = {
  readonly headline: string;
};

export function RunDetailBreadcrumb(props: RunDetailBreadcrumbProps) {
  const { headline } = props;
  const { vocabulary } = useGovernanceMode();

  return (
    <nav aria-label="Breadcrumb" className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
      <Link className={OPERATOR_LINK.nav} href="/">
        {OPERATOR_NAV_LINK_LABELS.home}
      </Link>
      {" · "}
      <Link className={OPERATOR_LINK.nav} href="/reviews?projectId=default">
        {vocabulary.reviewPlural}
      </Link>
      {" · "}
      <span className="font-medium text-neutral-800 dark:text-neutral-200" aria-current="page">
        {headline}
      </span>
      <span className="sr-only">{` — ${vocabulary.reviewDetailTitle}`}</span>
    </nav>
  );
}
