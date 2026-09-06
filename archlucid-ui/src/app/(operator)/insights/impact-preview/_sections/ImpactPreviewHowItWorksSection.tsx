"use client";

import { cn } from "@/lib/utils";
import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { OPERATOR_DISCLOSURE_TRIGGER_CLASS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  IMPACT_PREVIEW_HOW_IT_WORKS_SUMMARY,
  IMPACT_PREVIEW_HOW_IT_WORKS_TITLE,
  IMPACT_PREVIEW_TRUST_NOTICE,
} from "@/lib/impact-preview-page-copy";
import {
  impactPreviewHowItWorksDisclosureHrefFromSearch,
  parseImpactPreviewHowItWorksOpenFromSearch,
} from "@/lib/insights/impact-preview-how-it-works-disclosure-url";

export function ImpactPreviewHowItWorksSection(): React.JSX.Element {
  const router = useRouter();
  const pathname = usePathname() ?? "/insights/impact-preview";
  const searchParams = useSearchParams();
  const impactPreviewHowItWorksOpenParam = searchParams.get("impactPreviewHowItWorksOpen");
  const [open, setOpenState] = useState(() =>
    parseImpactPreviewHowItWorksOpenFromSearch(impactPreviewHowItWorksOpenParam),
  );

  const syncOpenToUrl = useCallback(
    (detailsOpen: boolean) => {
      router.replace(
        impactPreviewHowItWorksDisclosureHrefFromSearch(searchParams.toString(), detailsOpen, pathname),
        { scroll: false },
      );
    },
    [pathname, router, searchParams],
  );

  const setOpen = useCallback(
    (detailsOpen: boolean) => {
      setOpenState(detailsOpen);
      syncOpenToUrl(detailsOpen);
    },
    [syncOpenToUrl],
  );

  useEffect(() => {
    setOpenState(parseImpactPreviewHowItWorksOpenFromSearch(impactPreviewHowItWorksOpenParam));
  }, [impactPreviewHowItWorksOpenParam]);

  return (
    <details
      className="max-w-3xl rounded-md border border-neutral-200 bg-neutral-50/50 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-900/30"
      data-testid="impact-preview-how-it-works"
      open={open}
      onToggle={(event) => {
        setOpen((event.currentTarget as HTMLDetailsElement).open);
      }}
    >
      <summary className={cn("cursor-pointer text-al-text-primary", OPERATOR_DISCLOSURE_TRIGGER_CLASS)}>
        {IMPACT_PREVIEW_HOW_IT_WORKS_TITLE}
      </summary>
      <p className={cn("m-0 mt-2 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>{IMPACT_PREVIEW_HOW_IT_WORKS_SUMMARY}</p>
      <p className={cn("m-0 mt-2 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>{IMPACT_PREVIEW_TRUST_NOTICE}</p>
    </details>
  );
}
