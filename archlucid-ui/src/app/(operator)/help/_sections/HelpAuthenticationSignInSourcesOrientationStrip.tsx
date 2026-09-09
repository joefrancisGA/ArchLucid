"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { CollapsibleSection } from "@/components/CollapsibleSection";
import { EvidenceOrientationSourcesSection } from "@/components/evidence-orientation/EvidenceOrientationSourcesSection";
import { EVIDENCE_SOURCES_STYLE } from "@/components/evidence-orientation/evidence-orientation-styles";
import {
  AUTHENTICATION_SIGN_IN_HELP_FOLLOW_UPS_TITLE,
  AUTHENTICATION_SIGN_IN_HELP_ORIENTATION_SOURCES_INTRO,
  AUTHENTICATION_SIGN_IN_HELP_SOURCES,
} from "@/lib/authentication-sign-in-help-evidence-copy";
import { AUTHENTICATION_SIGN_IN_HELP_ORIENTATION_BOTTOM_TEST_ID } from "@/lib/authentication-sign-in-help-page-copy";
import {
  helpAuthenticationSignInSourcesDisclosureHrefFromSearch,
  parseHelpAuthenticationSignInSourcesOpenFromSearch,
} from "@/lib/help/help-authentication-sign-in-sources-disclosure-url";

/** Sources-only follow-ups for `/help/authentication-sign-in` buyer-polished shell (HEA). */
export function HelpAuthenticationSignInSourcesOrientationStrip(): React.JSX.Element {
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();
  const helpAuthenticationSignInSourcesOpenParam = searchParams.get("helpAuthenticationSignInSourcesOpen");
  const [sourcesOpen, setSourcesOpenState] = useState(() =>
    parseHelpAuthenticationSignInSourcesOpenFromSearch(helpAuthenticationSignInSourcesOpenParam),
  );

  const syncSourcesOpenToUrl = useCallback(
    (open: boolean) => {
      router.replace(
        helpAuthenticationSignInSourcesDisclosureHrefFromSearch(searchParams.toString(), open, pathname),
        {
          scroll: false,
        },
      );
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
    setSourcesOpenState(parseHelpAuthenticationSignInSourcesOpenFromSearch(helpAuthenticationSignInSourcesOpenParam));
  }, [helpAuthenticationSignInSourcesOpenParam]);

  return (
    <CollapsibleSection
      title={AUTHENTICATION_SIGN_IN_HELP_FOLLOW_UPS_TITLE}
      summaryLine={AUTHENTICATION_SIGN_IN_HELP_ORIENTATION_SOURCES_INTRO}
      sectionTestId={AUTHENTICATION_SIGN_IN_HELP_ORIENTATION_BOTTOM_TEST_ID}
      open={sourcesOpen}
      onToggle={setSourcesOpen}
    >
      <EvidenceOrientationSourcesSection
        testId="authentication-sign-in-help-sources"
        headingId="where-to-go-next"
        title={AUTHENTICATION_SIGN_IN_HELP_FOLLOW_UPS_TITLE}
        intro={AUTHENTICATION_SIGN_IN_HELP_ORIENTATION_SOURCES_INTRO}
        links={AUTHENTICATION_SIGN_IN_HELP_SOURCES}
        style={EVIDENCE_SOURCES_STYLE.operatorRaised}
        layout="columns"
      />
    </CollapsibleSection>
  );
}
