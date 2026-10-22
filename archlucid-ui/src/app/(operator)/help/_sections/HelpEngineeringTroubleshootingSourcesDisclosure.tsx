"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { CollapsibleSection } from "@/components/CollapsibleSection";
import {
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

type HelpEngineeringTroubleshootingSourcesDisclosureProps = {
  readonly entry: ProductDocumentationEntry;
  readonly sectionTestId?: string;
};

/** Single shared Repository sources disclosure for the engineering troubleshooting runbook. */
export function HelpEngineeringTroubleshootingSourcesDisclosure(
  props: HelpEngineeringTroubleshootingSourcesDisclosureProps,
): React.ReactElement {
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
    <CollapsibleSection
      title={ENGINEERING_TROUBLESHOOTING_HELP_SOURCES_DISCLOSURE_TITLE}
      summaryLine={ENGINEERING_TROUBLESHOOTING_HELP_SOURCES_DISCLOSURE_INTRO}
      sectionTestId={props.sectionTestId ?? "help-engineering-troubleshooting-sources"}
      open={sourcesOpen}
      onToggle={setSourcesOpen}
    >
      <ul className={cn("m-0 list-none space-y-2 p-0", OPERATOR_TYPOGRAPHY.body)}>
        {props.entry.sourcePaths.map((sourcePath) => (
          <li key={sourcePath} className="space-y-0.5">
            <p className="m-0 font-medium text-al-text-primary">{humanizeMarkdownFileReference(sourcePath)}</p>
            <p
              className={cn("m-0 font-mono text-xs text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
              data-testid="help-engineering-troubleshooting-source-path"
            >
              {sourcePath}
            </p>
          </li>
        ))}
      </ul>
    </CollapsibleSection>
  );
}
