"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { CollapsibleSection } from "@/components/CollapsibleSection";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { humanizeMarkdownFileReference } from "@/lib/help/help-markdown-presentation";
import {
  HELP_TOPIC_REGISTRY_SOURCES_DISCLOSURE_INTRO,
  HELP_TOPIC_REGISTRY_SOURCES_DISCLOSURE_TITLE,
} from "@/lib/help/help-topic-registry-evidence-copy";
import {
  HELP_TOPIC_REGISTRY_SOURCES_OPEN_PARAM,
  helpTopicRegistrySourcesDisclosureHrefFromSearch,
  parseHelpTopicRegistrySourcesOpenFromSearch,
} from "@/lib/help/help-topic-registry-sources-disclosure-url";
import type { ProductDocumentationEntry } from "@/lib/product-documentation-registry";
import { cn } from "@/lib/utils";

type HelpTopicRegistrySourcesDisclosureProps = {
  readonly entry: ProductDocumentationEntry;
  readonly sectionTestId?: string;
};

/** URL-synced repository sources disclosure for specialty help guides. */
export function HelpTopicRegistrySourcesDisclosure(
  props: HelpTopicRegistrySourcesDisclosureProps,
): React.ReactElement {
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();
  const sourcesOpenParam = searchParams.get(HELP_TOPIC_REGISTRY_SOURCES_OPEN_PARAM);
  const [sourcesOpen, setSourcesOpenState] = useState(() =>
    parseHelpTopicRegistrySourcesOpenFromSearch(sourcesOpenParam),
  );

  const syncSourcesOpenToUrl = useCallback(
    (open: boolean) => {
      router.replace(
        helpTopicRegistrySourcesDisclosureHrefFromSearch(searchParams.toString(), open, pathname),
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
    setSourcesOpenState(parseHelpTopicRegistrySourcesOpenFromSearch(sourcesOpenParam));
  }, [sourcesOpenParam]);

  return (
    <CollapsibleSection
      title={HELP_TOPIC_REGISTRY_SOURCES_DISCLOSURE_TITLE}
      summaryLine={HELP_TOPIC_REGISTRY_SOURCES_DISCLOSURE_INTRO}
      sectionTestId={props.sectionTestId ?? `help-${props.entry.slug}-sources`}
      open={sourcesOpen}
      onToggle={setSourcesOpen}
    >
      <ul className={cn("m-0 list-none space-y-2 p-0", OPERATOR_TYPOGRAPHY.body)}>
        {props.entry.sourcePaths.map((sourcePath) => (
          <li key={sourcePath} className="space-y-0.5">
            <p className="m-0 font-medium text-al-text-primary">{humanizeMarkdownFileReference(sourcePath)}</p>
            <p
              className={cn("m-0 font-mono text-xs text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
              data-testid="help-topic-registry-source-path"
            >
              {sourcePath}
            </p>
          </li>
        ))}
      </ul>
    </CollapsibleSection>
  );
}
