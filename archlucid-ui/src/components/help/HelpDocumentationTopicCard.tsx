"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";

import { HelpCenterDocumentationBadge } from "@/components/help/HelpCenterDocumentationBadge";
import { HelpTopicPdfDownloadButton } from "@/components/help/HelpTopicPdfDownloadButton";
import { Button } from "@/components/ui/button";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { getHelpCenterDisplay } from "@/lib/help-center-catalog";
import { inAppHelpHref, type ProductDocumentationEntry } from "@/lib/product-documentation-registry";

type HelpDocumentationTopicCardProps = {
  readonly entry: ProductDocumentationEntry;
};

function HelpDocumentationTopicExportAffordance(props: HelpDocumentationTopicCardProps): React.JSX.Element {
  const { entry } = props;

  if (entry.pdfStatus !== null) {
    return <HelpTopicPdfDownloadButton entry={entry} />;
  }

  return (
    <Button type="button" variant="outline" size="sm" asChild data-testid="help-topic-doc-reference-link">
      <Link href={inAppHelpHref(entry.slug)}>Open reference</Link>
    </Button>
  );
}

export function HelpDocumentationTopicCard(props: HelpDocumentationTopicCardProps): React.JSX.Element {
  const display = getHelpCenterDisplay(props.entry);

  return (
    <li className="list-none">
      <article
        className={cn(
          "flex h-full flex-col gap-3 rounded-md border border-neutral-200 bg-white px-3 py-3 shadow-sm dark:border-neutral-800 dark:bg-neutral-950",
          OPERATOR_TYPOGRAPHY.body,
        )}
        data-testid={`help-documentation-topic-${props.entry.slug}`}
      >
        <div className="flex flex-wrap items-center gap-2">
          <HelpCenterDocumentationBadge />
          <Link href={inAppHelpHref(props.entry.slug)} className={cn(OPERATOR_LINK.inline, OPERATOR_TYPOGRAPHY.cardTitle)}>
            {display.title}
          </Link>
        </div>
        <p className={cn("m-0 flex-1", OPERATOR_TYPOGRAPHY.helper)}>{display.summary}</p>
        <HelpDocumentationTopicExportAffordance entry={props.entry} />
      </article>
    </li>
  );
}
