"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { CollapsibleSection } from "@/components/CollapsibleSection";
import { EvidenceOrientationSourcesSection } from "@/components/evidence-orientation/EvidenceOrientationSourcesSection";
import { EVIDENCE_SOURCES_STYLE } from "@/components/evidence-orientation/evidence-orientation-styles";
import {
  HELP_TOPIC_CATCHALL_FOLLOW_UPS_TITLE,
  HELP_TOPIC_CATCHALL_SOURCES,
  HELP_TOPIC_CATCHALL_SOURCES_INTRO,
} from "@/lib/help/help-topic-catchall-evidence-copy";
import { HELP_TOPIC_CATCHALL_ORIENTATION_BOTTOM_TEST_ID } from "@/lib/help/help-topic-catchall-page-copy";
import {
  helpTopicCatchallSourcesDisclosureHrefFromSearch,
  parseHelpTopicCatchallSourcesOpenFromSearch,
} from "@/lib/help/help-topic-catchall-sources-disclosure-url";

/** Sources-only follow-ups for `/help/[...topic]` buyer-polished residual shell (HE.). */
export function HelpTopicCatchallSourcesOrientationStrip(): React.JSX.Element {
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();
  const sourcesOpenParam = searchParams.get("helpTopicCatchallSourcesOpen");
  const [sourcesOpen, setSourcesOpenState] = useState(() =>
    parseHelpTopicCatchallSourcesOpenFromSearch(sourcesOpenParam),
  );

  const syncSourcesOpenToUrl = useCallback(
    (open: boolean) => {
      router.replace(helpTopicCatchallSourcesDisclosureHrefFromSearch(searchParams.toString(), open, pathname), {
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
    setSourcesOpenState(parseHelpTopicCatchallSourcesOpenFromSearch(sourcesOpenParam));
  }, [sourcesOpenParam]);

  return (
    <CollapsibleSection
      title={HELP_TOPIC_CATCHALL_FOLLOW_UPS_TITLE}
      summaryLine={HELP_TOPIC_CATCHALL_SOURCES_INTRO}
      sectionTestId={HELP_TOPIC_CATCHALL_ORIENTATION_BOTTOM_TEST_ID}
      open={sourcesOpen}
      onToggle={setSourcesOpen}
    >
      <EvidenceOrientationSourcesSection
        testId="help-topic-catchall-sources"
        headingId="where-to-go-next"
        title={HELP_TOPIC_CATCHALL_FOLLOW_UPS_TITLE}
        intro={HELP_TOPIC_CATCHALL_SOURCES_INTRO}
        links={HELP_TOPIC_CATCHALL_SOURCES}
        style={EVIDENCE_SOURCES_STYLE.operatorRaised}
        layout="columns"
      />
    </CollapsibleSection>
  );
}
