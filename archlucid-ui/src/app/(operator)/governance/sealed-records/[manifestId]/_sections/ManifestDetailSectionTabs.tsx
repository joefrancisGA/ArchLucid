"use client";

import { useEffect, useState, type ReactElement, type ReactNode } from "react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OPERATOR_LAYOUT } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";
import { scheduleScrollToReviewDetailSection } from "@/lib/review-detail-section-scroll";
import {
  MANIFEST_DETAIL_DEFAULT_TAB,
  MANIFEST_DETAIL_TAB_IDS,
  MANIFEST_DETAIL_TAB_LABELS,
  MANIFEST_DETAIL_TABLIST_ARIA_LABEL,
  type ManifestDetailSectionTabId,
  readManifestDetailSectionTabFromWindowLocation,
  resolveManifestDetailSectionTab,
  resolveManifestDetailSectionTabFromHash,
  writeManifestDetailSectionTabToUrl,
} from "@/lib/manifest-detail-section-tabs";

export type ManifestDetailSectionTabsProps = {
  readonly initialTab?: ManifestDetailSectionTabId;
  readonly decision: ReactNode;
  readonly evidence: ReactNode;
  readonly downloads: ReactNode;
  readonly diligence: ReactNode;
};

/**
 * Carbon line tabs for the buyer-polished Finalized review record body.
 * Header, orientation, and authority hero stay above this shell; the evidence footer stays below.
 */
export function ManifestDetailSectionTabs(props: ManifestDetailSectionTabsProps): ReactElement {
  const initialTab = props.initialTab ?? MANIFEST_DETAIL_DEFAULT_TAB;
  const [activeTab, setActiveTab] = useState<ManifestDetailSectionTabId>(initialTab);
  const [hashResolved, setHashResolved] = useState(false);

  useEffect(() => {
    if (hashResolved) {
      return;
    }

    const hash = window.location.hash.slice(1);
    const tabFromHash = resolveManifestDetailSectionTabFromHash(hash);

    if (tabFromHash === null) {
      setHashResolved(true);

      return;
    }

    setActiveTab(tabFromHash);
    writeManifestDetailSectionTabToUrl(tabFromHash, { hash });
    setHashResolved(true);

    if (hash.length > 0) {
      scheduleScrollToReviewDetailSection(hash);
    }
  }, [hashResolved]);

  useEffect(() => {
    const onPopState = (): void => {
      setActiveTab(readManifestDetailSectionTabFromWindowLocation());
    };

    window.addEventListener("popstate", onPopState);

    return () => {
      window.removeEventListener("popstate", onPopState);
    };
  }, []);

  const panels: Record<ManifestDetailSectionTabId, ReactNode> = {
    decision: props.decision,
    evidence: props.evidence,
    downloads: props.downloads,
    diligence: props.diligence,
  };

  return (
    <Tabs
      value={activeTab}
      onValueChange={(next) => {
        const tab = resolveManifestDetailSectionTab(next);
        setActiveTab(tab);
        writeManifestDetailSectionTabToUrl(tab, { hash: null });
      }}
      data-testid="manifest-detail-section-tabs"
    >
      <TabsList aria-label={MANIFEST_DETAIL_TABLIST_ARIA_LABEL}>
        {MANIFEST_DETAIL_TAB_IDS.map((tabId) => (
          <TabsTrigger
            key={tabId}
            value={tabId}
            className="shrink-0"
            data-testid={`manifest-detail-tab-${tabId}`}
          >
            {MANIFEST_DETAIL_TAB_LABELS[tabId]}
          </TabsTrigger>
        ))}
      </TabsList>

      {MANIFEST_DETAIL_TAB_IDS.map((tabId) => (
        <TabsContent
          key={tabId}
          value={tabId}
          className={cn("min-w-0 overflow-visible", OPERATOR_LAYOUT.sectionStack)}
          data-testid={`manifest-detail-panel-${tabId}`}
        >
          {panels[tabId]}
        </TabsContent>
      ))}
    </Tabs>
  );
}
