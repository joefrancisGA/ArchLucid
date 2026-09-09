"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { CollapsibleSection } from "@/components/CollapsibleSection";
import { EvidenceOrientationSourcesSection } from "@/components/evidence-orientation/EvidenceOrientationSourcesSection";
import { EVIDENCE_SOURCES_STYLE } from "@/components/evidence-orientation/evidence-orientation-styles";
import {
  ACCELERATOR_CHOOSER_HELP_FOLLOW_UPS_TITLE,
  ACCELERATOR_CHOOSER_HELP_ORIENTATION_SOURCES_INTRO,
  ACCELERATOR_CHOOSER_HELP_RELATED_NEXT_STEPS,
} from "@/lib/accelerator-chooser-help-evidence-copy";
import { ACCELERATOR_CHOOSER_HELP_ORIENTATION_BOTTOM_TEST_ID } from "@/lib/accelerator-chooser-help-page-copy";
import {
  helpAcceleratorChooserSourcesDisclosureHrefFromSearch,
  parseHelpAcceleratorChooserSourcesOpenFromSearch,
} from "@/lib/help/help-accelerator-chooser-sources-disclosure-url";

/** Sources-only follow-ups for `/help/accelerator-chooser` buyer-polished shell (HAX). */
export function AcceleratorChooserHelpSourcesOrientationStrip(): React.JSX.Element {
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();
  const sourcesOpenParam = searchParams.get("helpAcceleratorChooserSourcesOpen");
  const [sourcesOpen, setSourcesOpenState] = useState(() =>
    parseHelpAcceleratorChooserSourcesOpenFromSearch(sourcesOpenParam),
  );

  const syncSourcesOpenToUrl = useCallback(
    (open: boolean) => {
      router.replace(helpAcceleratorChooserSourcesDisclosureHrefFromSearch(searchParams.toString(), open, pathname), {
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
    setSourcesOpenState(parseHelpAcceleratorChooserSourcesOpenFromSearch(sourcesOpenParam));
  }, [sourcesOpenParam]);

  return (
    <CollapsibleSection
      title={ACCELERATOR_CHOOSER_HELP_FOLLOW_UPS_TITLE}
      summaryLine={ACCELERATOR_CHOOSER_HELP_ORIENTATION_SOURCES_INTRO}
      sectionTestId={ACCELERATOR_CHOOSER_HELP_ORIENTATION_BOTTOM_TEST_ID}
      open={sourcesOpen}
      onToggle={setSourcesOpen}
    >
      <EvidenceOrientationSourcesSection
        testId="help-accelerator-chooser-sources"
        headingId="where-to-go-next"
        title={ACCELERATOR_CHOOSER_HELP_FOLLOW_UPS_TITLE}
        intro={ACCELERATOR_CHOOSER_HELP_ORIENTATION_SOURCES_INTRO}
        links={ACCELERATOR_CHOOSER_HELP_RELATED_NEXT_STEPS}
        style={EVIDENCE_SOURCES_STYLE.operatorRaised}
        layout="columns"
      />
    </CollapsibleSection>
  );
}
