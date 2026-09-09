"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { CollapsibleSection } from "@/components/CollapsibleSection";
import { EvidenceOrientationSourcesSection } from "@/components/evidence-orientation/EvidenceOrientationSourcesSection";
import { EVIDENCE_SOURCES_STYLE } from "@/components/evidence-orientation/evidence-orientation-styles";
import {
  helpModelGovernanceSourcesDisclosureHrefFromSearch,
  parseHelpModelGovernanceSourcesOpenFromSearch,
} from "@/lib/help/help-model-governance-sources-disclosure-url";
import {
  MODEL_GOVERNANCE_HELP_FOLLOW_UPS_TITLE,
  MODEL_GOVERNANCE_HELP_SOURCES,
  MODEL_GOVERNANCE_HELP_SOURCES_INTRO,
} from "@/lib/model-governance-help-evidence-copy";
import { MODEL_GOVERNANCE_HELP_ORIENTATION_BOTTOM_TEST_ID } from "@/lib/model-governance-help-page-copy";

/** Sources-only follow-ups for `/help/model-governance` buyer-polished shell (HMO). */
export function HelpModelGovernanceSourcesOrientationStrip(): React.JSX.Element {
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();
  const sourcesOpenParam = searchParams.get("helpModelGovernanceSourcesOpen");
  const [sourcesOpen, setSourcesOpenState] = useState(() =>
    parseHelpModelGovernanceSourcesOpenFromSearch(sourcesOpenParam),
  );

  const syncSourcesOpenToUrl = useCallback(
    (open: boolean) => {
      router.replace(helpModelGovernanceSourcesDisclosureHrefFromSearch(searchParams.toString(), open, pathname), {
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
    setSourcesOpenState(parseHelpModelGovernanceSourcesOpenFromSearch(sourcesOpenParam));
  }, [sourcesOpenParam]);

  return (
    <CollapsibleSection
      title={MODEL_GOVERNANCE_HELP_FOLLOW_UPS_TITLE}
      summaryLine={MODEL_GOVERNANCE_HELP_SOURCES_INTRO}
      sectionTestId={MODEL_GOVERNANCE_HELP_ORIENTATION_BOTTOM_TEST_ID}
      open={sourcesOpen}
      onToggle={setSourcesOpen}
    >
      <EvidenceOrientationSourcesSection
        testId="help-model-governance-sources"
        headingId="where-to-go-next"
        title={MODEL_GOVERNANCE_HELP_FOLLOW_UPS_TITLE}
        intro={MODEL_GOVERNANCE_HELP_SOURCES_INTRO}
        links={MODEL_GOVERNANCE_HELP_SOURCES}
        style={EVIDENCE_SOURCES_STYLE.operatorRaised}
        layout="columns"
      />
    </CollapsibleSection>
  );
}
