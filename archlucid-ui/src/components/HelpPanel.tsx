"use client";

import { cn } from "@/lib/utils";
import { ChevronRight, Search } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from "react";

import { InlineGuidanceLabel } from "@/components/InlineGuidanceLabel";
import { useNavCommittedArchitectureReview } from "@/components/operator/OperatorNavAuthorityProvider";
import { HelpDrawerContent } from "@/components/help/HelpDrawerContent";
import {
  Dialog,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { KeyboardShortcutsTabContent, matchesShortcutQuery } from "@/components/KeyboardShortcutsHelpContent";
import { ALERTS_PAGE_SHORTCUTS, SHORTCUTS } from "@/lib/shortcut-registry";
import { corePilotHelpStepForPath } from "@/lib/core-pilot-help-step-for-path";
import { CORE_PILOT_STEPS } from "@/lib/core-pilot-steps";
import {
  getDocHref,
  getHelpTopicHref,
  helpTopicsForGuidesTab,
  helpTopicsForTroubleshootingTab,
  type HelpTopic,
} from "@/lib/help/help-topics";
import { SIGNED_MANIFEST_LABEL } from "@/lib/usability/canonical-product-terms";
import { OPERATOR_LINK, OPERATOR_NAV_GROUP_LABEL, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { SupportBundleDownloadButton } from "@/components/SupportBundleDownloadButton";
import { Button } from "@/components/ui/button";
import { DismissControl } from "@/components/usability/DismissControl";

export type HelpTabId = "guides" | "shortcuts" | "troubleshooting";

export type HelpPanelProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** When the panel opens, select this tab (defaults to Guides). */
  initialTab?: HelpTabId;
};

const HELP_CORE_PILOT_PIN_DISMISSED_SESSION_KEY = "archlucid_help_core_pilot_pin_dismissed_session";

const KEY_CONCEPTS: { label: string; text: string }[] = [
  { label: "Request", text: "The architecture intent you submit." },
  { label: "Architecture review", text: "The packaged review created from a request (context, graph, findings, signed review record)." },
  { label: SIGNED_MANIFEST_LABEL, text: "The governed architecture output produced when a review is finalized." },
  { label: "Artifacts", text: "Supporting files, findings, and review materials." },
];

function allShortcutRowsForSearch(): { key: string; description: string }[] {
  const rows: { key: string; description: string }[] = [];

  for (const s of SHORTCUTS) {
    rows.push({ key: s.key, description: s.description });
  }

  for (const s of ALERTS_PAGE_SHORTCUTS) {
    rows.push({ key: s.key, description: s.description });
  }

  return rows;
}

type HelpGuideTopicLinkRowProps = {
  readonly topic: HelpTopic;
  readonly href: string;
  readonly onNavigate: () => void;
};

function HelpGuideTopicLinkRow({ topic, href, onNavigate }: HelpGuideTopicLinkRowProps): React.JSX.Element {
  return (
    <li className="list-none">
      <Link
        href={href}
        title={topic.docPath.length > 0 ? topic.docPath : href}
        className={cn(
          "flex w-full items-start gap-3 rounded-md border border-neutral-200/90 bg-white p-3 text-left shadow-sm transition-colors hover:border-neutral-300 hover:bg-neutral-50 dark:border-neutral-600 dark:bg-neutral-900/50 dark:hover:border-neutral-500 dark:hover:bg-neutral-900",
          OPERATOR_LINK.nav,
        )}
        onClick={onNavigate}
      >
        <span className="min-w-0 flex-1">
          <span className="block font-medium text-neutral-900 dark:text-neutral-100">{topic.title}</span>
          <span className={cn("mt-1 block text-neutral-600 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.body)}>
            {topic.summary}
          </span>
        </span>
        <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-neutral-400 dark:text-neutral-500" aria-hidden />
      </Link>
    </li>
  );
}

/**
 * Contextual help guides drawer: guides, keyboard shortcuts, and troubleshooting in one right-edge panel.
 */
export function HelpPanel({ open, onOpenChange, initialTab = "guides" }: HelpPanelProps) {
  const pathname = usePathname() ?? "/";
  const hasCommittedArchitectureReview = useNavCommittedArchitectureReview();
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<HelpTabId>(initialTab);
  const [corePilotPinDismissedThisSession, setCorePilotPinDismissedThisSession] = useState(false);

  useEffect(() => {
    if (open) {
      setTab(initialTab);
    }
  }, [open, initialTab]);

  useLayoutEffect(() => {
    try {
      if (typeof window === "undefined") {
        return;
      }

      if (sessionStorage.getItem(HELP_CORE_PILOT_PIN_DISMISSED_SESSION_KEY) === "1") {
        setCorePilotPinDismissedThisSession(true);
      }
    } catch {
      /* private mode */
    }
  }, []);

  const dismissCorePilotPinForSession = useCallback(() => {
    try {
      if (typeof window !== "undefined") {
        sessionStorage.setItem(HELP_CORE_PILOT_PIN_DISMISSED_SESSION_KEY, "1");
      }
    } catch {
      /* private mode */
    }

    setCorePilotPinDismissedThisSession(true);
  }, []);

  const allShortcutRows = useMemo(() => allShortcutRowsForSearch(), []);

  const topicMatchesQuery = useCallback(
    (t: HelpTopic) => {
      const q = query.trim().toLowerCase();

      if (q.length === 0) {
        return true;
      }

      return (
        t.title.toLowerCase().includes(q) ||
        t.summary.toLowerCase().includes(q) ||
        t.keywords.some((k) => k.includes(q))
      );
    },
    [query],
  );

  const guidesBase = useMemo(() => helpTopicsForGuidesTab(), []);
  const troubleshootingBase = useMemo(() => helpTopicsForTroubleshootingTab(), []);

  const guidesFiltered = useMemo(() => {
    const q = query.trim();

    if (q.length === 0) {
      const byRoute = guidesBase.filter((topic) =>
        topic.routes.some((route) => pathname === route || pathname.startsWith(`${route}/`)),
      );

      return byRoute.length > 0 ? byRoute : guidesBase;
    }

    return guidesBase.filter(topicMatchesQuery);
  }, [guidesBase, pathname, query, topicMatchesQuery]);

  const troubleshootingFiltered = useMemo(() => {
    if (query.trim().length === 0) {
      return troubleshootingBase;
    }

    return troubleshootingBase.filter(topicMatchesQuery);
  }, [query, topicMatchesQuery, troubleshootingBase]);

  const shortcutsSearchHits = useMemo(() => {
    const q = query.trim();

    if (q.length === 0) {
      return allShortcutRows;
    }

    return allShortcutRows.filter((row) => matchesShortcutQuery(q, row.description, row.key));
  }, [allShortcutRows, query]);

  const corePilotPinnedHelp = useMemo(() => {
    if (hasCommittedArchitectureReview || corePilotPinDismissedThisSession) {
      return null;
    }

    if (query.trim().length > 0) {
      return null;
    }

    const pilotCtx = corePilotHelpStepForPath(pathname);

    if (pilotCtx === null) {
      return null;
    }

    const corePilotGuideHref = getDocHref("docs/CORE_PILOT.md");

    return (
      <div className="rounded-md border border-neutral-200 bg-al-surface-raised p-3 dark:border-neutral-800">
        <h3 className={cn("m-0 font-semibold text-teal-900 dark:text-teal-200", OPERATOR_NAV_GROUP_LABEL)}>
          Core Pilot — suggested next step
        </h3>
        <p className={cn("m-0 mt-2 font-medium text-neutral-900 dark:text-neutral-100", OPERATOR_TYPOGRAPHY.body)}>
          Step {pilotCtx.stepIndex + 1} of {CORE_PILOT_STEPS.length}: {pilotCtx.step.title}
        </p>
        <p className={cn("m-0 mt-1 text-neutral-600 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.body)}>{pilotCtx.step.shortBody}</p>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap gap-2">
            <Button asChild size="sm" variant="primary">
              <Link href={pilotCtx.step.primaryHref} onClick={() => onOpenChange(false)}>
                {pilotCtx.step.primaryLabel}
              </Link>
            </Button>
            {corePilotGuideHref ? (
              <Button asChild size="sm" variant="outline">
                <Link href={corePilotGuideHref} onClick={() => onOpenChange(false)}>
                  Open Core Pilot guide
                </Link>
              </Button>
            ) : null}
          </div>
          <DismissControl
            className={cn(
              "h-8 text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100",
              OPERATOR_TYPOGRAPHY.button,
            )}
            label="Dismiss for this session"
            onDismiss={dismissCorePilotPinForSession}
          />
        </div>
      </div>
    );
  }, [
    corePilotPinDismissedThisSession,
    dismissCorePilotPinForSession,
    hasCommittedArchitectureReview,
    onOpenChange,
    pathname,
    query,
  ]);

  function handleOpenChange(next: boolean): void {
    if (!next) {
      setQuery("");
      setTab("guides");
    }

    onOpenChange(next);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
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
                  "h-9 border-neutral-200 bg-white pl-8 font-normal text-neutral-900 shadow-none placeholder:text-neutral-400 focus-visible:ring-1 focus-visible:ring-teal-500 dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-100",
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
              {corePilotPinnedHelp}
              <div className="rounded-md border border-neutral-200 bg-al-surface-raised p-3 dark:border-neutral-800">
                <h3 className={cn("m-0 font-semibold text-teal-900 dark:text-teal-200", OPERATOR_NAV_GROUP_LABEL)}>
                  Key concepts
                </h3>
                <ul className={cn("m-0 mt-2 list-none space-y-1.5 p-0 text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.body)}>
                  {KEY_CONCEPTS.map((row) => (
                    <li key={row.label}>
                      <InlineGuidanceLabel label={`${row.label}:`} /> {row.text}
                    </li>
                  ))}
                </ul>
              </div>
              <h3 className={cn("m-0 font-semibold text-neutral-500 dark:text-neutral-400", OPERATOR_NAV_GROUP_LABEL)}>
                Topics
              </h3>
              {guidesFiltered.length === 0 ? (
                <p className={cn("m-0 text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.body)}>No topics match your search.</p>
              ) : (
                <ul className="m-0 space-y-2 p-0">
                  {guidesFiltered.map((topic) => {
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
                  {troubleshootingFiltered.map((topic) => {
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
              {query.trim().length > 0 && shortcutsSearchHits.length === 0 ? (
                <p className={cn("m-0 text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.body)}>No shortcuts match your search.</p>
              ) : query.trim().length > 0 ? (
                <div>
                  <h3 className={cn("mb-2 font-semibold text-neutral-500 dark:text-neutral-400", OPERATOR_NAV_GROUP_LABEL)}>
                    Search results
                  </h3>
                  <div className="space-y-2 rounded-md border border-neutral-200/80 p-2 dark:border-neutral-600">
                    {shortcutsSearchHits.map((row) => (
                      <div key={row.key} className={cn("text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.body)}>
                        <kbd className={cn(
                          "mr-2 rounded border border-neutral-200 bg-neutral-50 px-1.5 py-0.5 font-mono dark:border-neutral-600 dark:bg-neutral-800",
                          OPERATOR_TYPOGRAPHY.micro,
                        )}>
                          {row.key}
                        </kbd>
                        {row.description}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <KeyboardShortcutsTabContent />
              )}
            </TabsContent>
          </div>
        </Tabs>

        <footer className="shrink-0 border-t border-neutral-100 px-5 py-3 dark:border-neutral-800">
          <p className={cn("m-0 text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
            In-app:{" "}
            <Link href="/architecture/first-review-guide" className={OPERATOR_LINK.nav} onClick={() => onOpenChange(false)}>
              Getting started
            </Link>{" "}
            (first-review checklist on Overview)
          </p>
        </footer>
      </HelpDrawerContent>
    </Dialog>
  );
}
