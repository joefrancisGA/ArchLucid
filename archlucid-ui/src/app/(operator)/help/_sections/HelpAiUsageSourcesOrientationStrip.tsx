"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { CollapsibleSection } from "@/components/CollapsibleSection";
import { EvidenceOrientationSourcesSection } from "@/components/evidence-orientation/EvidenceOrientationSourcesSection";
import { EVIDENCE_SOURCES_STYLE } from "@/components/evidence-orientation/evidence-orientation-styles";
import {
  AI_USAGE_HELP_FOLLOW_UPS_TITLE,
  AI_USAGE_HELP_ORIENTATION_SOURCES_INTRO,
  AI_USAGE_HELP_SOURCES,
} from "@/lib/ai-usage-help-evidence-copy";
import { AI_USAGE_HELP_ORIENTATION_BOTTOM_TEST_ID } from "@/lib/ai-usage-help-page-copy";
import {
  helpAiUsageSourcesDisclosureHrefFromSearch,
  parseHelpAiUsageSourcesOpenFromSearch,
} from "@/lib/help/help-ai-usage-sources-disclosure-url";

/** Sources-only follow-ups for `/help/ai-usage` buyer-polished shell (HAI). */
export function HelpAiUsageSourcesOrientationStrip(): React.JSX.Element {
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();
  const helpAiUsageSourcesOpenParam = searchParams.get("helpAiUsageSourcesOpen");
  const [sourcesOpen, setSourcesOpenState] = useState(() =>
    parseHelpAiUsageSourcesOpenFromSearch(helpAiUsageSourcesOpenParam),
  );

  const syncSourcesOpenToUrl = useCallback(
    (open: boolean) => {
      router.replace(helpAiUsageSourcesDisclosureHrefFromSearch(searchParams.toString(), open, pathname), {
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
    setSourcesOpenState(parseHelpAiUsageSourcesOpenFromSearch(helpAiUsageSourcesOpenParam));
  }, [helpAiUsageSourcesOpenParam]);

  return (
    <CollapsibleSection
      title={AI_USAGE_HELP_FOLLOW_UPS_TITLE}
      summaryLine={AI_USAGE_HELP_ORIENTATION_SOURCES_INTRO}
      sectionTestId={AI_USAGE_HELP_ORIENTATION_BOTTOM_TEST_ID}
      open={sourcesOpen}
      onToggle={setSourcesOpen}
    >
      <EvidenceOrientationSourcesSection
        testId="help-ai-usage-sources"
        headingId="where-to-go-next"
        title={AI_USAGE_HELP_FOLLOW_UPS_TITLE}
        intro={AI_USAGE_HELP_ORIENTATION_SOURCES_INTRO}
        links={AI_USAGE_HELP_SOURCES}
        style={EVIDENCE_SOURCES_STYLE.operatorRaised}
        layout="columns"
      />
    </CollapsibleSection>
  );
}
