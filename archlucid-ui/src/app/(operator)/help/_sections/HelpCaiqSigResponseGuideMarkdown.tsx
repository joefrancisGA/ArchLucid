"use client";

import type { ReactElement } from "react";

import { HelpCaiqSigResponseSigDeferredDisclosure } from "@/app/(operator)/help/_sections/HelpCaiqSigResponseSigDeferredDisclosure";
import { MarketingAccessibilityMarkdownFragment } from "@/components/marketing/MarketingAccessibilityMarkdownFragment";
import {
  CAIQ_SIG_RESPONSE_SIG_DEFERRED_SUMMARY,
  CAIQ_SIG_RESPONSE_SIG_DEFERRED_TEST_ID,
} from "@/lib/caiq-sig-response-help-guide-content";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

type HelpCaiqSigResponseGuideMarkdownProps = {
  readonly markdownBody: string;
  readonly entryTitle: string;
  readonly helpTopicSlug: string;
  readonly sourceDocPath: string;
  readonly liteMarkdown: string;
  readonly sigMarkdown: string;
};

/**
 * CAIQ/SIG lite + deferred SIG markdown (client boundary).
 * Evidence/status table cells pass renderInline callbacks and cannot prerender from a server parent.
 */
export function HelpCaiqSigResponseGuideMarkdown(props: HelpCaiqSigResponseGuideMarkdownProps): ReactElement {
  const { markdownBody, entryTitle, helpTopicSlug, sourceDocPath, liteMarkdown, sigMarkdown } = props;

  return (
    <>
      <MarketingAccessibilityMarkdownFragment
        markdownBody={markdownBody}
        tableCaption={`${entryTitle} reference table`}
        presentation="help"
        sourceDocPath={sourceDocPath}
        helpTopicSlug={helpTopicSlug}
        preparedMarkdownOverride={liteMarkdown}
      />

      {sigMarkdown.length > 0 ? (
        <HelpCaiqSigResponseSigDeferredDisclosure
          className="mt-4 rounded-md border border-neutral-200 bg-neutral-50/80 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-950/40"
          summaryClassName={cn(
            "cursor-pointer select-none font-medium text-al-text-primary",
            OPERATOR_TYPOGRAPHY.body,
          )}
          bodyClassName={HELP_PAGE_LAYOUT.detailsBody}
          summary={CAIQ_SIG_RESPONSE_SIG_DEFERRED_SUMMARY}
          detailsTestId={CAIQ_SIG_RESPONSE_SIG_DEFERRED_TEST_ID}
          bodyTestId="help-caiq-sig-response-sig-deferred-body"
          markdownBody={markdownBody}
          tableCaption={`${entryTitle} SIG reference table`}
          sourceDocPath={sourceDocPath}
          helpTopicSlug={helpTopicSlug}
          preparedMarkdownOverride={sigMarkdown}
        />
      ) : null}
    </>
  );
}
