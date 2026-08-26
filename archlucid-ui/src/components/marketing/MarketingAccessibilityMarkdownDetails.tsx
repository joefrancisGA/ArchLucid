import { cn } from "@/lib/utils";
import { OPERATOR_DISCLOSURE_TRIGGER_CLASS } from "@/lib/design-tokens";
import type { ReactNode } from "react";

import { HelpLazyDetails } from "@/components/help/HelpLazyDetails";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";

import { MarketingAccessibilityMarkdownFragment } from "./MarketingAccessibilityMarkdownFragment";

export function parseDetailsSummary(openingLine: string, nextLine: string | undefined): { summary: string; contentStartOffset: number } {
  const attributeMatch = openingLine.match(/<details[^>]*\ssummary="([^"]*)"/i);

  if (attributeMatch?.[1] !== undefined) {
    return { summary: attributeMatch[1], contentStartOffset: 0 };
  }

  const summaryLine = nextLine?.trim() ?? "";
  const inlineSummaryMatch = summaryLine.match(/^<summary>([\s\S]*?)<\/summary>$/i);

  if (inlineSummaryMatch?.[1] !== undefined) {
    return { summary: inlineSummaryMatch[1].trim(), contentStartOffset: 1 };
  }

  return { summary: "Advanced", contentStartOffset: 0 };
}

export function parseDetailsTestId(openingLine: string): string | undefined {
  const testIdMatch = openingLine.match(/data-testid="([^"]+)"/i);

  return testIdMatch?.[1];
}


export type MarketingAccessibilityMarkdownDetailsProps = {
  readonly summary: string;
  readonly detailsTestId: string | undefined;
  readonly innerMarkdown: string;
  readonly isHelp: boolean;
  readonly tableCaption: string;
  readonly presentation: "marketing" | "help" | "privacy" | undefined;
  readonly sourceDocPath: string | undefined;
};

export function MarketingAccessibilityMarkdownDetailsBlock(
  props: MarketingAccessibilityMarkdownDetailsProps,
): ReactNode {
  return (
    <HelpLazyDetails
      data-testid={props.detailsTestId}
      className={
        props.isHelp
          ? HELP_PAGE_LAYOUT.details
          : "my-4 rounded-md border border-neutral-200 bg-neutral-50/80 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-950/40"
      }
      summaryClassName={cn("cursor-pointer select-none", OPERATOR_DISCLOSURE_TRIGGER_CLASS)}
      summary={props.summary}
      bodyClassName={
        props.isHelp
          ? HELP_PAGE_LAYOUT.detailsBody
          : "mt-3 border-t border-neutral-200 pt-3 dark:border-neutral-700"
      }
    >
      {props.innerMarkdown.length > 0 ? (
        <MarketingAccessibilityMarkdownFragment
          markdownBody={props.innerMarkdown}
          tableCaption={props.tableCaption}
          presentation={props.presentation}
          sourceDocPath={props.sourceDocPath}
        />
      ) : null}
    </HelpLazyDetails>
  );
}
