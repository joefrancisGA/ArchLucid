"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { CollapsibleSection } from "@/components/CollapsibleSection";
import { EvidenceOrientationSourcesSection } from "@/components/evidence-orientation/EvidenceOrientationSourcesSection";
import { EVIDENCE_SOURCES_STYLE } from "@/components/evidence-orientation/evidence-orientation-styles";
import {
  SCOPE_HELP_FOLLOW_UPS_TITLE,
  SCOPE_HELP_SOURCES,
  SCOPE_HELP_SOURCES_INTRO,
} from "@/lib/scope-help-evidence-copy";
import { SCOPE_HELP_ORIENTATION_BOTTOM_TEST_ID } from "@/lib/scope-help-page-copy";
import {
  helpScopeSourcesDisclosureHrefFromSearch,
  parseHelpScopeSourcesOpenFromSearch,
} from "@/lib/help/help-scope-sources-disclosure-url";

/** Sources-only follow-ups for `/help/scope` buyer-polished shell (HSX). */
export function HelpScopeSourcesOrientationStrip(): React.JSX.Element {
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();
  const sourcesOpenParam = searchParams.get("helpScopeSourcesOpen");
  const [sourcesOpen, setSourcesOpenState] = useState(() =>
    parseHelpScopeSourcesOpenFromSearch(sourcesOpenParam),
  );

  const syncSourcesOpenToUrl = useCallback(
    (open: boolean) => {
      router.replace(helpScopeSourcesDisclosureHrefFromSearch(searchParams.toString(), open, pathname), {
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
    setSourcesOpenState(parseHelpScopeSourcesOpenFromSearch(sourcesOpenParam));
  }, [sourcesOpenParam]);

  return (
    <CollapsibleSection
      title={SCOPE_HELP_FOLLOW_UPS_TITLE}
      summaryLine={SCOPE_HELP_SOURCES_INTRO}
      sectionTestId={SCOPE_HELP_ORIENTATION_BOTTOM_TEST_ID}
      open={sourcesOpen}
      onToggle={setSourcesOpen}
    >
      <EvidenceOrientationSourcesSection
        testId="help-scope-sources"
        headingId="where-to-go-next"
        title={SCOPE_HELP_FOLLOW_UPS_TITLE}
        intro={SCOPE_HELP_SOURCES_INTRO}
        links={SCOPE_HELP_SOURCES}
        style={EVIDENCE_SOURCES_STYLE.operatorRaised}
        layout="columns"
      />
    </CollapsibleSection>
  );
}
