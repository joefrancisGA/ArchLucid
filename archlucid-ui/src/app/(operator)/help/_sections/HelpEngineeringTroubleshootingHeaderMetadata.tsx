"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { CollapsibleSection } from "@/components/CollapsibleSection";
import {
  ENGINEERING_TROUBLESHOOTING_HELP_RUNBOOK_OVERVIEW,
  ENGINEERING_TROUBLESHOOTING_HELP_SOURCES_DISCLOSURE_INTRO,
  ENGINEERING_TROUBLESHOOTING_HELP_SOURCES_DISCLOSURE_TITLE,
} from "@/lib/engineering-troubleshooting-help-guide-content";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { humanizeMarkdownFileReference } from "@/lib/help/help-markdown-presentation";
import {
  HELP_ENGINEERING_TROUBLESHOOTING_SOURCES_OPEN_PARAM,
  helpEngineeringTroubleshootingSourcesDisclosureHrefFromSearch,
  parseHelpEngineeringTroubleshootingSourcesOpenFromSearch,
} from "@/lib/help/help-engineering-troubleshooting-sources-disclosure-url";
import type { ProductDocumentationEntry } from "@/lib/product-documentation-registry";
import { cn } from "@/lib/utils";

type HelpEngineeringTroubleshootingHeaderMetadataProps = {
  readonly entry: ProductDocumentationEntry;
};

export function HelpEngineeringTroubleshootingHeaderMetadata(
  props: HelpEngineeringTroubleshootingHeaderMetadataProps,
): React.ReactElement {
  const { entry } = props;
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();
  const sourcesOpenParam = searchParams.get(HELP_ENGINEERING_TROUBLESHOOTING_SOURCES_OPEN_PARAM);
  const [sourcesOpen, setSourcesOpenState] = useState(() =>
    parseHelpEngineeringTroubleshootingSourcesOpenFromSearch(sourcesOpenParam),
  );

  const syncSourcesOpenToUrl = useCallback(
    (open: boolean) => {
      router.replace(
        helpEngineeringTroubleshootingSourcesDisclosureHrefFromSearch(searchParams.toString(), open, pathname),
        { scroll: false },
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
    setSourcesOpenState(parseHelpEngineeringTroubleshootingSourcesOpenFromSearch(sourcesOpenParam));
  }, [sourcesOpenParam]);

  return (
    <div className="space-y-2" data-testid="help-engineering-troubleshooting-header-metadata">
      <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.label)}>
        <span className="font-medium text-al-text-primary">
          {ENGINEERING_TROUBLESHOOTING_HELP_RUNBOOK_OVERVIEW.documentTitle}
        </span>
      </p>

      <CollapsibleSection
        title={ENGINEERING_TROUBLESHOOTING_HELP_SOURCES_DISCLOSURE_TITLE}
        summaryLine={ENGINEERING_TROUBLESHOOTING_HELP_SOURCES_DISCLOSURE_INTRO}
        sectionTestId="help-engineering-troubleshooting-sources"
        open={sourcesOpen}
        onToggle={setSourcesOpen}
      >
        <ul className={cn("m-0 list-disc space-y-1 pl-5", OPERATOR_TYPOGRAPHY.body)}>
          {entry.sourcePaths.map((sourcePath) => (
            <li key={sourcePath}>{humanizeMarkdownFileReference(sourcePath)}</li>
          ))}
        </ul>
      </CollapsibleSection>
    </div>
  );
}
