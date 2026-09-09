"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { CollapsibleSection } from "@/components/CollapsibleSection";
import { EvidenceOrientationSourcesSection } from "@/components/evidence-orientation/EvidenceOrientationSourcesSection";
import { EVIDENCE_SOURCES_STYLE } from "@/components/evidence-orientation/evidence-orientation-styles";
import {
  CAIQ_SIG_RESPONSE_HELP_FOLLOW_UPS_TITLE,
  CAIQ_SIG_RESPONSE_HELP_SOURCES,
  CAIQ_SIG_RESPONSE_HELP_SOURCES_INTRO,
} from "@/lib/caiq-sig-response-help-evidence-copy";
import { CAIQ_SIG_RESPONSE_HELP_ORIENTATION_BOTTOM_TEST_ID } from "@/lib/caiq-sig-response-help-page-copy";
import {
  helpCaiqSigResponseSourcesDisclosureHrefFromSearch,
  parseHelpCaiqSigResponseSourcesOpenFromSearch,
} from "@/lib/help/help-caiq-sig-response-sources-disclosure-url";

/** Sources-only follow-ups for `/help/caiq-sig-response` buyer-polished shell (ECA). */
export function HelpCaiqSigResponseSourcesOrientationStrip(): React.JSX.Element {
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();
  const sourcesOpenParam = searchParams.get("helpCaiqSigResponseSourcesOpen");
  const [sourcesOpen, setSourcesOpenState] = useState(() =>
    parseHelpCaiqSigResponseSourcesOpenFromSearch(sourcesOpenParam),
  );

  const syncSourcesOpenToUrl = useCallback(
    (open: boolean) => {
      router.replace(helpCaiqSigResponseSourcesDisclosureHrefFromSearch(searchParams.toString(), open, pathname), {
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
    setSourcesOpenState(parseHelpCaiqSigResponseSourcesOpenFromSearch(sourcesOpenParam));
  }, [sourcesOpenParam]);

  return (
    <CollapsibleSection
      title={CAIQ_SIG_RESPONSE_HELP_FOLLOW_UPS_TITLE}
      summaryLine={CAIQ_SIG_RESPONSE_HELP_SOURCES_INTRO}
      sectionTestId={CAIQ_SIG_RESPONSE_HELP_ORIENTATION_BOTTOM_TEST_ID}
      open={sourcesOpen}
      onToggle={setSourcesOpen}
    >
      <EvidenceOrientationSourcesSection
        testId="help-caiq-sig-response-sources"
        headingId="where-to-go-next"
        title={CAIQ_SIG_RESPONSE_HELP_FOLLOW_UPS_TITLE}
        intro={CAIQ_SIG_RESPONSE_HELP_SOURCES_INTRO}
        links={CAIQ_SIG_RESPONSE_HELP_SOURCES}
        style={EVIDENCE_SOURCES_STYLE.operatorRaised}
        layout="columns"
      />
    </CollapsibleSection>
  );
}
