"use client";

import { CollapsibleSection } from "@/components/CollapsibleSection";
import {
  EvidenceOrientationSourcesSection,
  type EvidenceOrientationSourcesLayout,
} from "@/components/evidence-orientation/EvidenceOrientationSourcesSection";
import { EVIDENCE_SOURCES_STYLE } from "@/components/evidence-orientation/evidence-orientation-styles";
import { useUrlSyncedSourcesDisclosure } from "@/hooks/use-url-synced-sources-disclosure";
import type { EvidenceOrientationLink } from "@/lib/evidence-surface-copy";

export type UrlSyncedSourcesCollapsibleStripProps = {
  readonly surfaceId: string;
  readonly searchParamKey: string;
  readonly parseOpenFromSearch: (value: string | null) => boolean;
  readonly disclosureHrefFromSearch: (
    currentSearch: string,
    open: boolean,
    pathname: string,
  ) => string;
  readonly sectionTestId: string;
  readonly title: string;
  readonly intro: string;
  readonly links: readonly EvidenceOrientationLink[];
  readonly sourcesTestId: string;
  readonly headingId?: string;
  readonly layout?: EvidenceOrientationSourcesLayout;
};

/** Collapsible Sources strip with URL sync, pre-commit auto-open, and dismiss persistence. */
export function UrlSyncedSourcesCollapsibleStrip(
  props: UrlSyncedSourcesCollapsibleStripProps,
): React.JSX.Element {
  const { sourcesOpen, setSourcesOpen } = useUrlSyncedSourcesDisclosure({
    surfaceId: props.surfaceId,
    searchParamKey: props.searchParamKey,
    parseOpenFromSearch: props.parseOpenFromSearch,
    disclosureHrefFromSearch: props.disclosureHrefFromSearch,
  });

  return (
    <CollapsibleSection
      title={props.title}
      summaryLine={props.intro}
      sectionTestId={props.sectionTestId}
      open={sourcesOpen}
      onToggle={setSourcesOpen}
    >
      <EvidenceOrientationSourcesSection
        testId={props.sourcesTestId}
        headingId={props.headingId ?? "where-to-go-next"}
        title={props.title}
        intro={props.intro}
        links={props.links}
        style={EVIDENCE_SOURCES_STYLE.operatorRaised}
        layout={props.layout ?? "columns"}
      />
    </CollapsibleSection>
  );
}
