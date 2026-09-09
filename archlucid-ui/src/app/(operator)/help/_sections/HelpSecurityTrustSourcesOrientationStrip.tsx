"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { CollapsibleSection } from "@/components/CollapsibleSection";
import { EvidenceOrientationSourcesSection } from "@/components/evidence-orientation/EvidenceOrientationSourcesSection";
import { EVIDENCE_SOURCES_STYLE } from "@/components/evidence-orientation/evidence-orientation-styles";
import {
  SECURITY_TRUST_HELP_FOLLOW_UPS_TITLE,
  SECURITY_TRUST_HELP_SOURCES,
  SECURITY_TRUST_HELP_SOURCES_INTRO,
} from "@/lib/security-trust-help-evidence-copy";
import { SECURITY_TRUST_HELP_ORIENTATION_BOTTOM_TEST_ID } from "@/lib/security-trust-help-page-copy";
import {
  helpSecurityTrustSourcesDisclosureHrefFromSearch,
  parseHelpSecurityTrustSourcesOpenFromSearch,
} from "@/lib/help/help-security-trust-sources-disclosure-url";

/** Sources-only follow-ups for `/help/security-trust` buyer-polished shell (HSE). */
export function HelpSecurityTrustSourcesOrientationStrip(): React.JSX.Element {
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();
  const sourcesOpenParam = searchParams.get("helpSecurityTrustSourcesOpen");
  const [sourcesOpen, setSourcesOpenState] = useState(() =>
    parseHelpSecurityTrustSourcesOpenFromSearch(sourcesOpenParam),
  );

  const syncSourcesOpenToUrl = useCallback(
    (open: boolean) => {
      router.replace(helpSecurityTrustSourcesDisclosureHrefFromSearch(searchParams.toString(), open, pathname), {
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
    setSourcesOpenState(parseHelpSecurityTrustSourcesOpenFromSearch(sourcesOpenParam));
  }, [sourcesOpenParam]);

  return (
    <CollapsibleSection
      title={SECURITY_TRUST_HELP_FOLLOW_UPS_TITLE}
      summaryLine={SECURITY_TRUST_HELP_SOURCES_INTRO}
      sectionTestId={SECURITY_TRUST_HELP_ORIENTATION_BOTTOM_TEST_ID}
      open={sourcesOpen}
      onToggle={setSourcesOpen}
    >
      <EvidenceOrientationSourcesSection
        testId="help-security-trust-sources"
        headingId="where-to-go-next"
        title={SECURITY_TRUST_HELP_FOLLOW_UPS_TITLE}
        intro={SECURITY_TRUST_HELP_SOURCES_INTRO}
        links={SECURITY_TRUST_HELP_SOURCES}
        style={EVIDENCE_SOURCES_STYLE.operatorRaised}
        layout="columns"
      />
    </CollapsibleSection>
  );
}
