"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { CollapsibleSection } from "@/components/CollapsibleSection";
import { EvidenceOrientationSourcesSection } from "@/components/evidence-orientation/EvidenceOrientationSourcesSection";
import { EVIDENCE_SOURCES_STYLE } from "@/components/evidence-orientation/evidence-orientation-styles";
import {
  CONNECT_AZURE_SECURELY_FOLLOW_UPS_TITLE,
  CONNECT_AZURE_SECURELY_SOURCES,
  CONNECT_AZURE_SECURELY_SOURCES_INTRO,
} from "@/lib/connect-azure-securely-help-content";
import { CONNECT_AZURE_SECURELY_HELP_ORIENTATION_BOTTOM_TEST_ID } from "@/lib/connect-azure-securely-help-page-copy";
import {
  helpConnectAzureSecurelySourcesDisclosureHrefFromSearch,
  parseHelpConnectAzureSecurelySourcesOpenFromSearch,
} from "@/lib/help/help-connect-azure-securely-sources-disclosure-url";

/** Sources-only follow-ups for `/help/cloud-connections/azure` buyer-polished shell (HC). */
export function HelpConnectAzureSecurelySourcesOrientationStrip(): React.JSX.Element {
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();
  const helpConnectAzureSecurelySourcesOpenParam = searchParams.get("helpConnectAzureSecurelySourcesOpen");
  const [sourcesOpen, setSourcesOpenState] = useState(() =>
    parseHelpConnectAzureSecurelySourcesOpenFromSearch(helpConnectAzureSecurelySourcesOpenParam),
  );

  const syncSourcesOpenToUrl = useCallback(
    (open: boolean) => {
      router.replace(
        helpConnectAzureSecurelySourcesDisclosureHrefFromSearch(searchParams.toString(), open, pathname),
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
    setSourcesOpenState(parseHelpConnectAzureSecurelySourcesOpenFromSearch(helpConnectAzureSecurelySourcesOpenParam));
  }, [helpConnectAzureSecurelySourcesOpenParam]);

  return (
    <CollapsibleSection
      title={CONNECT_AZURE_SECURELY_FOLLOW_UPS_TITLE}
      summaryLine={CONNECT_AZURE_SECURELY_SOURCES_INTRO}
      sectionTestId={CONNECT_AZURE_SECURELY_HELP_ORIENTATION_BOTTOM_TEST_ID}
      open={sourcesOpen}
      onToggle={setSourcesOpen}
    >
      <EvidenceOrientationSourcesSection
        testId="help-connect-azure-securely-sources"
        headingId="where-to-go-next"
        title={CONNECT_AZURE_SECURELY_FOLLOW_UPS_TITLE}
        intro={CONNECT_AZURE_SECURELY_SOURCES_INTRO}
        links={CONNECT_AZURE_SECURELY_SOURCES}
        style={EVIDENCE_SOURCES_STYLE.operatorRaised}
        layout="columns"
      />
    </CollapsibleSection>
  );
}
