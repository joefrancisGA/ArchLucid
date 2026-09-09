"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { CollapsibleSection } from "@/components/CollapsibleSection";
import { EvidenceOrientationSourcesSection } from "@/components/evidence-orientation/EvidenceOrientationSourcesSection";
import { EVIDENCE_SOURCES_STYLE } from "@/components/evidence-orientation/evidence-orientation-styles";
import {
  BILLING_AND_PLANS_HELP_FOLLOW_UPS_TITLE,
  BILLING_AND_PLANS_HELP_SOURCES,
  BILLING_AND_PLANS_HELP_SOURCES_INTRO,
} from "@/lib/billing-and-plans-help-evidence-copy";
import { BILLING_HELP_ORIENTATION_BOTTOM_TEST_ID } from "@/lib/billing-and-plans-help-page-copy";
import {
  helpBillingAndPlansSourcesDisclosureHrefFromSearch,
  parseHelpBillingAndPlansSourcesOpenFromSearch,
} from "@/lib/help/help-billing-and-plans-sources-disclosure-url";

/** Sources-only follow-ups for `/help/billing-and-plans` buyer-polished shell (HBX). */
export function HelpBillingAndPlansSourcesOrientationStrip(): React.JSX.Element {
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();
  const sourcesOpenParam = searchParams.get("helpBillingAndPlansSourcesOpen");
  const [sourcesOpen, setSourcesOpenState] = useState(() =>
    parseHelpBillingAndPlansSourcesOpenFromSearch(sourcesOpenParam),
  );

  const syncSourcesOpenToUrl = useCallback(
    (open: boolean) => {
      router.replace(helpBillingAndPlansSourcesDisclosureHrefFromSearch(searchParams.toString(), open, pathname), {
        scroll: false,
      });
    },
    [pathname, router, searchParams],
  );

  const setSourcesOpen = useCallback(
    (open: boolean) => {
      setSourcesOpenState(open);
      syncSourcesOpenToUrl(open);
    },
    [syncSourcesOpenToUrl],
  );

  useEffect(() => {
    setSourcesOpenState(parseHelpBillingAndPlansSourcesOpenFromSearch(sourcesOpenParam));
  }, [sourcesOpenParam]);

  return (
    <CollapsibleSection
      title={BILLING_AND_PLANS_HELP_FOLLOW_UPS_TITLE}
      summaryLine={BILLING_AND_PLANS_HELP_SOURCES_INTRO}
      sectionTestId={BILLING_HELP_ORIENTATION_BOTTOM_TEST_ID}
      open={sourcesOpen}
      onToggle={setSourcesOpen}
    >
      <EvidenceOrientationSourcesSection
        testId="help-billing-and-plans-sources"
        headingId="where-to-go-next"
        title={BILLING_AND_PLANS_HELP_FOLLOW_UPS_TITLE}
        intro={BILLING_AND_PLANS_HELP_SOURCES_INTRO}
        links={BILLING_AND_PLANS_HELP_SOURCES}
        style={EVIDENCE_SOURCES_STYLE.operatorRaised}
        layout="columns"
      />
    </CollapsibleSection>
  );
}
