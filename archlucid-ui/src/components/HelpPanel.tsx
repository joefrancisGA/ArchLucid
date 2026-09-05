"use client";

import { cn } from "@/lib/utils";
import { Search } from "lucide-react";
import Link from "next/link";

import { HelpDrawerContent } from "@/components/help/HelpDrawerContent";
import {
  Dialog,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getHelpTopicHref, type HelpTopic } from "@/lib/help/help-topics";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { SupportBundleDownloadButton } from "@/components/SupportBundleDownloadButton";
import { OperatorShellSupportQuickLinks } from "@/components/help/OperatorShellSupportQuickLinks";

import { HelpGuideTopicLinkRow } from "./help-panel-topic-filter";
import { HelpPanelGuidesTab } from "./HelpPanelGuidesTab";
import { HelpPanelShortcutsTab } from "./HelpPanelShortcutsTab";
import { useHelpPanel, type HelpPanelProps, type HelpTabId } from "./use-help-panel";

export type { HelpTabId, HelpPanelProps } from "./use-help-panel";

/**
 * Contextual help guides drawer: guides, keyboard shortcuts, and troubleshooting in one right-edge panel.
 */
export function HelpPanel(props: HelpPanelProps) {
  const {
    query,
    setQuery,
    tab,
    setTab,
    guidesFiltered,
    troubleshootingFiltered,
    shortcutsSearchHits,
    corePilotPinnedHelp,
    handleOpenChange,
    onOpenChange,
  } = useHelpPanel(props);

  return (
    <Dialog open={props.open} onOpenChange={handleOpenChange}>
      <HelpDrawerContent
        data-testid="help-guides-panel"
        closeAriaLabel="Close help guides"
        aria-label="Help guides and troubleshooting"
        className="max-w-[min(100vw,520px)]"
      >
        <DialogHeader className="shrink-0 space-y-1 border-b border-neutral-100 px-5 pb-3 pt-5 dark:border-neutral-800">
          <DialogTitle className="text-left text-lg text-neutral-900 dark:text-neutral-100">Help guides</DialogTitle>
          <DialogDescription className={cn("text-left text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.body)}>
            Search ArchLucid guidance, docs, and shortcuts.
          </DialogDescription>
        </DialogHeader>

        <Tabs
          value={tab}
          onValueChange={(next) => {
            setTab(next as HelpTabId);
          }}
          variant="line"
          className="flex min-h-0 flex-1 flex-col"
        >
          <div className="shrink-0 space-y-3 border-b border-neutral-100 px-5 py-3 dark:border-neutral-800">
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-neutral-400"
                aria-hidden
              />
              <Input
                id="help-guides-search"
                type="search"
                className={cn(
                  "h-9 border-neutral-200 bg-white pl-8 font-normal text-neutral-900 shadow-none placeholder:text-neutral-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--al-accent-border-focus)] dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-100",
                  OPERATOR_TYPOGRAPHY.body,
                )}
                placeholder="Search help, docs, or shortcuts"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                }}
                aria-label="Search help, docs, or shortcuts"
              />
            </div>
            <TabsList aria-label="Help sections" data-testid="help-panel-tablist">
              <TabsTrigger value="guides">Guides</TabsTrigger>
              <TabsTrigger value="shortcuts">Keyboard shortcuts</TabsTrigger>
              <TabsTrigger value="troubleshooting">Troubleshooting</TabsTrigger>
            </TabsList>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
            <TabsContent value="guides" className="space-y-4 pt-0" data-testid="help-panel-tabpanel-guides">
              <HelpPanelGuidesTab
                corePilotPinnedHelp={corePilotPinnedHelp}
                guidesFiltered={guidesFiltered}
                onNavigate={() => onOpenChange(false)}
              />
            </TabsContent>

            <TabsContent value="troubleshooting" className="space-y-3 pt-0" data-testid="help-panel-tabpanel-troubleshooting">
              <div className="rounded-md border border-neutral-200 bg-al-surface-raised p-3 dark:border-neutral-800">
                <p className={cn("m-0 font-medium text-neutral-900 dark:text-neutral-100", OPERATOR_TYPOGRAPHY.body)}>Support bundle</p>
                <p className={cn("mt-1 text-neutral-600 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.body)}>
                  Download a redacted diagnostics ZIP for support tickets (same artefact as Admin → Support).
                </p>
                <SupportBundleDownloadButton className="mt-3 space-y-2" />
              </div>
              {troubleshootingFiltered.length === 0 ? (
                <p className={cn("m-0 text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.body)}>No topics match your search.</p>
              ) : (
                <ul className="m-0 space-y-2 p-0">
                  {troubleshootingFiltered.map((topic: HelpTopic) => {
                    const href = getHelpTopicHref(topic);

                    if (href === null) {
                      return (
                        <li
                          key={topic.id}
                          className="rounded-md border border-neutral-200/90 bg-white p-3 dark:border-neutral-600 dark:bg-neutral-900/50"
                        >
                          <div className="font-medium text-neutral-900 dark:text-neutral-100">{topic.title}</div>
                          <p className={cn("mt-1 text-neutral-600 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.body)}>{topic.summary}</p>
                        </li>
                      );
                    }

                    return (
                      <HelpGuideTopicLinkRow
                        key={topic.id}
                        topic={topic}
                        href={href}
                        onNavigate={() => onOpenChange(false)}
                      />
                    );
                  })}
                </ul>
              )}
            </TabsContent>

            <TabsContent value="shortcuts" className="space-y-3 pt-0" data-testid="help-panel-tabpanel-shortcuts">
              <HelpPanelShortcutsTab query={query} shortcutsSearchHits={shortcutsSearchHits} />
            </TabsContent>
          </div>
        </Tabs>

        <footer className="shrink-0 space-y-2 border-t border-neutral-100 px-5 py-3 dark:border-neutral-800">
          <OperatorShellSupportQuickLinks onNavigate={() => onOpenChange(false)} />
          <p className={cn("m-0 text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
            In-app:{" "}
            <Link href="/architecture/first-review-guide" className={OPERATOR_LINK.nav} onClick={() => onOpenChange(false)}>
              Getting started
            </Link>{" "}
            (first-review checklist on Home)
          </p>
        </footer>
      </HelpDrawerContent>
    </Dialog>
  );
}
