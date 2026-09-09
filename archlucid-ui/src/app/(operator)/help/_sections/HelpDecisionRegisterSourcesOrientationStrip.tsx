"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { CollapsibleSection } from "@/components/CollapsibleSection";
import { EvidenceOrientationSourcesSection } from "@/components/evidence-orientation/EvidenceOrientationSourcesSection";
import { EVIDENCE_SOURCES_STYLE } from "@/components/evidence-orientation/evidence-orientation-styles";
import {
  DECISION_REGISTER_HELP_FOLLOW_UPS_TITLE,
  DECISION_REGISTER_HELP_SOURCES,
  DECISION_REGISTER_HELP_SOURCES_INTRO,
} from "@/lib/decision-register-help-evidence-copy";
import { DECISION_REGISTER_HELP_ORIENTATION_BOTTOM_TEST_ID } from "@/lib/decision-register-help-page-copy";
import {
  helpDecisionRegisterSourcesDisclosureHrefFromSearch,
  parseHelpDecisionRegisterSourcesOpenFromSearch,
} from "@/lib/help/help-decision-register-sources-disclosure-url";

/** Sources-only follow-ups for `/help/decision-register` buyer-polished shell (HDE). */
export function HelpDecisionRegisterSourcesOrientationStrip(): React.JSX.Element {
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();
  const sourcesOpenParam = searchParams.get("helpDecisionRegisterSourcesOpen");
  const [sourcesOpen, setSourcesOpenState] = useState(() =>
    parseHelpDecisionRegisterSourcesOpenFromSearch(sourcesOpenParam),
  );

  const syncSourcesOpenToUrl = useCallback(
    (open: boolean) => {
      router.replace(helpDecisionRegisterSourcesDisclosureHrefFromSearch(searchParams.toString(), open, pathname), {
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
    setSourcesOpenState(parseHelpDecisionRegisterSourcesOpenFromSearch(sourcesOpenParam));
  }, [sourcesOpenParam]);

  return (
    <CollapsibleSection
      title={DECISION_REGISTER_HELP_FOLLOW_UPS_TITLE}
      summaryLine={DECISION_REGISTER_HELP_SOURCES_INTRO}
      sectionTestId={DECISION_REGISTER_HELP_ORIENTATION_BOTTOM_TEST_ID}
      open={sourcesOpen}
      onToggle={setSourcesOpen}
    >
      <EvidenceOrientationSourcesSection
        testId="help-decision-register-sources"
        headingId="where-to-go-next"
        title={DECISION_REGISTER_HELP_FOLLOW_UPS_TITLE}
        intro={DECISION_REGISTER_HELP_SOURCES_INTRO}
        links={DECISION_REGISTER_HELP_SOURCES}
        style={EVIDENCE_SOURCES_STYLE.operatorRaised}
        layout="columns"
      />
    </CollapsibleSection>
  );
}
