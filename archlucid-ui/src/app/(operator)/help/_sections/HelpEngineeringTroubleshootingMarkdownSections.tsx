"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { HelpLazyDetails } from "@/components/help/HelpLazyDetails";
import { OperatorSeverityCallout } from "@/components/help/OperatorSeverityCallout";
import { MarketingAccessibilityMarkdownFragment } from "@/components/marketing/MarketingAccessibilityMarkdownFragment";
import { Button } from "@/components/ui/button";
import { resolveEngineeringTroubleshootingMarkdownSectionRisk } from "@/lib/engineering-troubleshooting-help-markdown-risk";
import {
  ENGINEERING_TROUBLESHOOTING_HELP_MARKDOWN_LOAD_ERROR_BODY,
  ENGINEERING_TROUBLESHOOTING_HELP_MARKDOWN_LOAD_ERROR_TITLE,
  ENGINEERING_TROUBLESHOOTING_HELP_MARKDOWN_TABLE_CAPTION,
  ENGINEERING_TROUBLESHOOTING_HELP_PRIMARY_ACTIONS,
} from "@/lib/engineering-troubleshooting-help-guide-content";
import { createHelpHeadingSlugAllocator, resolveHelpHeadingId } from "@/lib/help/help-heading-slug";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";
import {
  helpEngineeringTroubleshootingMarkdownSectionDisclosureHrefFromSearch,
  parseHelpEngineeringTroubleshootingMarkdownSectionKeyFromSearch,
} from "@/lib/help/help-engineering-troubleshooting-markdown-section-disclosure-url";
import {
  DESIGN_TOKENS,
  OPERATOR_DISCLOSURE_TRIGGER_CLASS,
  OPERATOR_SHELL_SCROLL_OFFSET_CLASS,
  OPERATOR_TYPOGRAPHY,
} from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export type HelpEngineeringTroubleshootingMarkdownSection = {
  readonly id: string;
  readonly title: string;
  readonly body: string;
};

export type HelpEngineeringTroubleshootingMarkdownSplit = {
  /** Markdown before the first `##` (goal, symptom index links, etc.). */
  readonly preamble: string;
  readonly sections: readonly HelpEngineeringTroubleshootingMarkdownSection[];
};

export function splitEngineeringTroubleshootingMarkdownSections(
  markdown: string,
): HelpEngineeringTroubleshootingMarkdownSplit {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const allocateSectionSlug = createHelpHeadingSlugAllocator();
  const sections: HelpEngineeringTroubleshootingMarkdownSection[] = [];
  const preambleLines: string[] = [];
  let currentTitle: string | null = null;
  let currentBodyLines: string[] = [];
  let seenFirstH2 = false;

  const flushSection = (): void => {
    if (currentTitle === null) {
      return;
    }

    const { id, title } = resolveHelpHeadingId(currentTitle, allocateSectionSlug);

    sections.push({
      id,
      title,
      body: currentBodyLines.join("\n").trim(),
    });
    currentTitle = null;
    currentBodyLines = [];
  };

  for (const line of lines) {
    if (line.startsWith("## ") && !line.startsWith("###")) {
      flushSection();
      seenFirstH2 = true;
      currentTitle = line.slice(3).trim();
      continue;
    }

    if (!seenFirstH2) {
      preambleLines.push(line);
      continue;
    }

    if (currentTitle !== null) {
      currentBodyLines.push(line);
    }
  }

  flushSection();

  return {
    preamble: preambleLines.join("\n").trim(),
    sections,
  };
}

function readLocationHash(): string {
  if (typeof window === "undefined") {
    return "";
  }

  return window.location.hash.replace(/^#/, "").trim();
}

type HelpEngineeringTroubleshootingMarkdownSectionsProps = {
  readonly markdown: string;
  readonly sourceDocPath: string;
  readonly helpTopicSlug: string;
};

/** Collapsed `##` sections for the engineering troubleshooting runbook (HDX). */
export function HelpEngineeringTroubleshootingMarkdownSections(
  props: HelpEngineeringTroubleshootingMarkdownSectionsProps,
): React.ReactElement {
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();
  const helpEngineeringTroubleshootingMarkdownSectionKeyParam = searchParams.get(
    "helpEngineeringTroubleshootingMarkdownSectionKey",
  );
  const [openSectionKey, setOpenSectionKeyState] = useState(() =>
    parseHelpEngineeringTroubleshootingMarkdownSectionKeyFromSearch(
      helpEngineeringTroubleshootingMarkdownSectionKeyParam,
    ),
  );

  const syncOpenSectionToUrl = useCallback(
    (sectionKey: string | null) => {
      router.replace(
        helpEngineeringTroubleshootingMarkdownSectionDisclosureHrefFromSearch(
          searchParams.toString(),
          sectionKey,
          pathname,
        ),
        { scroll: false },
      );
    },
    [pathname, router, searchParams],
  );

  const setOpenSectionKey = useCallback(
    (sectionKey: string | null) => {
      setOpenSectionKeyState(sectionKey ?? "");
      syncOpenSectionToUrl(sectionKey);
    },
    [syncOpenSectionToUrl],
  );

  useEffect(() => {
    setOpenSectionKeyState(
      parseHelpEngineeringTroubleshootingMarkdownSectionKeyFromSearch(
        helpEngineeringTroubleshootingMarkdownSectionKeyParam,
      ),
    );
  }, [helpEngineeringTroubleshootingMarkdownSectionKeyParam]);

  const { preamble, sections } = splitEngineeringTroubleshootingMarkdownSections(props.markdown);
  const markdownUnavailable = props.markdown.trim().length === 0;

  useEffect(() => {
    const syncFromHash = (): void => {
      const hash = readLocationHash();

      if (hash.length === 0) {
        return;
      }

      if (!sections.some((section) => section.id === hash)) {
        return;
      }

      setOpenSectionKey(hash);
    };

    syncFromHash();
    window.addEventListener("hashchange", syncFromHash);
    window.addEventListener("archlucid:help-hash-scroll", syncFromHash);

    return () => {
      window.removeEventListener("hashchange", syncFromHash);
      window.removeEventListener("archlucid:help-hash-scroll", syncFromHash);
    };
  }, [sections, setOpenSectionKey]);

  useEffect(() => {
    if (openSectionKey.length === 0) {
      return;
    }

    const hash = readLocationHash();

    if (hash.length === 0 || hash !== openSectionKey) {
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      document.getElementById(openSectionKey)?.scrollIntoView({ behavior: "smooth", block: "start" });
    });

    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, [openSectionKey]);

  if (markdownUnavailable) {
    return (
      <section
        aria-labelledby="help-engineering-troubleshooting-markdown-error-heading"
        className={cn(DESIGN_TOKENS.callout.warn, "space-y-3 p-4")}
        data-testid="help-engineering-troubleshooting-markdown-error"
      >
        <h2
          id="help-engineering-troubleshooting-markdown-error-heading"
          className={cn("m-0", OPERATOR_TYPOGRAPHY.sectionTitle)}
        >
          {ENGINEERING_TROUBLESHOOTING_HELP_MARKDOWN_LOAD_ERROR_TITLE}
        </h2>
        <p className={cn("m-0 max-w-prose text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
          {ENGINEERING_TROUBLESHOOTING_HELP_MARKDOWN_LOAD_ERROR_BODY}
        </p>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            data-testid="help-engineering-troubleshooting-markdown-retry"
            onClick={() => {
              window.location.reload();
            }}
          >
            Refresh page
          </Button>
          <Button asChild size="sm" variant="outline" data-testid="help-engineering-troubleshooting-markdown-report">
            <Link href={ENGINEERING_TROUBLESHOOTING_HELP_PRIMARY_ACTIONS.openReportAProblem.href}>
              {ENGINEERING_TROUBLESHOOTING_HELP_PRIMARY_ACTIONS.openReportAProblem.label}
            </Link>
          </Button>
        </div>
      </section>
    );
  }

  return (
    <div className="space-y-4" data-testid="help-engineering-troubleshooting-markdown-sections">
      {preamble.length > 0 ? (
        <div data-testid="help-engineering-troubleshooting-markdown-preamble">
          <MarketingAccessibilityMarkdownFragment
            markdownBody={preamble}
            tableCaption={ENGINEERING_TROUBLESHOOTING_HELP_MARKDOWN_TABLE_CAPTION}
            presentation="help"
            sourceDocPath={props.sourceDocPath}
            helpTopicSlug={props.helpTopicSlug}
            preserveMaintenanceMetadata
            preparedMarkdownOverride={preamble}
          />
        </div>
      ) : null}

      {sections.map((section) => {
        const sectionRisk = resolveEngineeringTroubleshootingMarkdownSectionRisk(section.title, section.body);

        return (
          <HelpLazyDetails
            key={section.id}
            className={HELP_PAGE_LAYOUT.details}
            data-testid="help-engineering-troubleshooting-markdown-section"
            summaryClassName={cn("cursor-pointer select-none", OPERATOR_DISCLOSURE_TRIGGER_CLASS)}
            summary={
              <h2
                id={section.id}
                className={cn(
                  "m-0 inline",
                  OPERATOR_SHELL_SCROLL_OFFSET_CLASS,
                  OPERATOR_TYPOGRAPHY.sectionTitle,
                )}
              >
                {section.title}
              </h2>
            }
            bodyClassName={HELP_PAGE_LAYOUT.detailsBody}
            mountOnHash
            open={openSectionKey === section.id}
            onOpenChange={(detailsOpen) => {
              setOpenSectionKey(detailsOpen ? section.id : null);
            }}
          >
            {sectionRisk !== null ? (
              <OperatorSeverityCallout
                kind={sectionRisk.kind}
                data-testid="help-engineering-troubleshooting-markdown-risk-callout"
                heading={sectionRisk.heading}
                headingId={`help-engineering-troubleshooting-markdown-risk-${section.id}`}
                className="mb-3 p-3"
              >
                <p className="m-0">{sectionRisk.body}</p>
              </OperatorSeverityCallout>
            ) : null}
            {section.body.length > 0 ? (
              <MarketingAccessibilityMarkdownFragment
                markdownBody={section.body}
                tableCaption={ENGINEERING_TROUBLESHOOTING_HELP_MARKDOWN_TABLE_CAPTION}
                presentation="help"
                sourceDocPath={props.sourceDocPath}
                helpTopicSlug={props.helpTopicSlug}
                preserveMaintenanceMetadata
                preparedMarkdownOverride={section.body}
              />
            ) : null}
          </HelpLazyDetails>
        );
      })}
    </div>
  );
}
