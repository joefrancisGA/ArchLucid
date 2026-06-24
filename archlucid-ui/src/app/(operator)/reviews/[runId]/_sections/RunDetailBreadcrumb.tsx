"use client";

import Link from "next/link";

import { useGovernanceMode } from "@/hooks/use-governance-mode";
import { OPERATOR_NAV_LINK_LABELS } from "@/lib/i18n";

type RunDetailBreadcrumbProps = {
  readonly headline: string;
};

export function RunDetailBreadcrumb(props: RunDetailBreadcrumbProps) {
  const { headline } = props;
  const { vocabulary } = useGovernanceMode();

  return (
    <nav aria-label="Breadcrumb" className="text-sm text-neutral-600 dark:text-neutral-400">
      <Link className="text-teal-800 underline dark:text-teal-300" href="/">
        {OPERATOR_NAV_LINK_LABELS.home}
      </Link>
      {" · "}
      <Link className="text-teal-800 underline dark:text-teal-300" href="/reviews?projectId=default">
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
