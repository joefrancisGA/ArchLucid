"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { CollapsibleSection } from "@/components/CollapsibleSection";
import { EvidenceOrientationSourcesSection } from "@/components/evidence-orientation/EvidenceOrientationSourcesSection";
import { EVIDENCE_SOURCES_STYLE } from "@/components/evidence-orientation/evidence-orientation-styles";
import {
  AZURE_BOARDS_HELP_FOLLOW_UPS_TITLE,
  AZURE_BOARDS_HELP_SOURCES,
  AZURE_BOARDS_HELP_SOURCES_INTRO,
} from "@/lib/azure-boards-help-evidence-copy";
import { AZURE_BOARDS_HELP_ORIENTATION_BOTTOM_TEST_ID } from "@/lib/azure-boards-help-page-copy";
import {
  helpAzureBoardsSourcesDisclosureHrefFromSearch,
  parseHelpAzureBoardsSourcesOpenFromSearch,
} from "@/lib/help/help-azure-boards-sources-disclosure-url";

/** Sources-only follow-ups for `/help/azure-boards` buyer-polished shell (HEZ). */
export function HelpAzureBoardsSourcesOrientationStrip(): React.JSX.Element {
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();
  const sourcesOpenParam = searchParams.get("helpAzureBoardsSourcesOpen");
  const [sourcesOpen, setSourcesOpenState] = useState(() =>
    parseHelpAzureBoardsSourcesOpenFromSearch(sourcesOpenParam),
  );

  const syncSourcesOpenToUrl = useCallback(
    (open: boolean) => {
      router.replace(helpAzureBoardsSourcesDisclosureHrefFromSearch(searchParams.toString(), open, pathname), {
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
    setSourcesOpenState(parseHelpAzureBoardsSourcesOpenFromSearch(sourcesOpenParam));
  }, [sourcesOpenParam]);

  return (
    <CollapsibleSection
      title={AZURE_BOARDS_HELP_FOLLOW_UPS_TITLE}
      summaryLine={AZURE_BOARDS_HELP_SOURCES_INTRO}
      sectionTestId={AZURE_BOARDS_HELP_ORIENTATION_BOTTOM_TEST_ID}
      open={sourcesOpen}
      onToggle={setSourcesOpen}
    >
      <EvidenceOrientationSourcesSection
        testId="help-azure-boards-sources"
        headingId="where-to-go-next"
        title={AZURE_BOARDS_HELP_FOLLOW_UPS_TITLE}
        intro={AZURE_BOARDS_HELP_SOURCES_INTRO}
        links={AZURE_BOARDS_HELP_SOURCES}
        style={EVIDENCE_SOURCES_STYLE.operatorRaised}
        layout="columns"
      />
    </CollapsibleSection>
  );
}
