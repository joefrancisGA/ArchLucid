"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { OPERATOR_HOME_ORIENTATION_BOTTOM_TEST_ID } from "@/app/(operator)/_sections/operator-home-page-surface-copy";
import { CollapsibleSection } from "@/components/CollapsibleSection";
import { EvidenceOrientationSourcesSection } from "@/components/evidence-orientation/EvidenceOrientationSourcesSection";
import { EVIDENCE_SOURCES_STYLE } from "@/components/evidence-orientation/evidence-orientation-styles";
import {
  OPERATOR_HOME_FOLLOW_UPS_TITLE,
  OPERATOR_HOME_ORIENTATION_SOURCES,
  OPERATOR_HOME_ORIENTATION_SOURCES_INTRO,
} from "@/lib/operator/operator-home-evidence-copy";
import {
  operatorHomeSourcesDisclosureHrefFromSearch,
  parseOperatorHomeSourcesOpenFromSearch,
} from "@/lib/operator/operator-home-sources-disclosure-url";

/** Sources-only follow-ups for `/` buyer-polished shell (HOM). */
export function OperatorHomeSourcesOrientationStrip(): React.JSX.Element {
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();
  const operatorHomeSourcesOpenParam = searchParams.get("operatorHomeSourcesOpen");
  const [sourcesOpen, setSourcesOpenState] = useState(() =>
    parseOperatorHomeSourcesOpenFromSearch(operatorHomeSourcesOpenParam),
  );

  const syncSourcesOpenToUrl = useCallback(
    (open: boolean) => {
      router.replace(operatorHomeSourcesDisclosureHrefFromSearch(searchParams.toString(), open, pathname), {
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
    setSourcesOpenState(parseOperatorHomeSourcesOpenFromSearch(operatorHomeSourcesOpenParam));
  }, [operatorHomeSourcesOpenParam]);

  return (
    <CollapsibleSection
      title={OPERATOR_HOME_FOLLOW_UPS_TITLE}
      summaryLine={OPERATOR_HOME_ORIENTATION_SOURCES_INTRO}
      sectionTestId={OPERATOR_HOME_ORIENTATION_BOTTOM_TEST_ID}
      open={sourcesOpen}
      onToggle={setSourcesOpen}
    >
      <EvidenceOrientationSourcesSection
        testId="operator-home-settings-sources"
        headingId="where-to-go-next"
        title={OPERATOR_HOME_FOLLOW_UPS_TITLE}
        intro={OPERATOR_HOME_ORIENTATION_SOURCES_INTRO}
        links={OPERATOR_HOME_ORIENTATION_SOURCES}
        style={EVIDENCE_SOURCES_STYLE.operatorRaised}
        layout="columns"
      />
    </CollapsibleSection>
  );
}
