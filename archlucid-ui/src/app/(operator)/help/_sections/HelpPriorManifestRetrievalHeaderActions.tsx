"use client";

import Link from "next/link";

import { HelpTopicPrintButton } from "@/components/help/HelpTopicPrintButton";
import { Button } from "@/components/ui/button";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { PRIOR_MANIFEST_RETRIEVAL_HELP_PRIMARY_ACTIONS } from "@/lib/prior-manifest-retrieval-help-guide-content";
import type { ProductDocumentationEntry } from "@/lib/product-documentation-registry";

type HelpPriorManifestRetrievalHeaderActionsProps = {
  readonly entry: ProductDocumentationEntry;
};

/** Header actions for `/help/prior-manifest-retrieval` (HPR). */
export function HelpPriorManifestRetrievalHeaderActions(
  props: HelpPriorManifestRetrievalHeaderActionsProps,
): React.JSX.Element {
  const { entry } = props;
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();

  return (
    <div className="flex flex-wrap items-center gap-2" data-testid="help-prior-manifest-retrieval-header-actions">
      <Button asChild size="sm" variant="primary" data-testid="help-prior-manifest-retrieval-open-ask">
        <Link href={PRIOR_MANIFEST_RETRIEVAL_HELP_PRIMARY_ACTIONS.openAsk.href}>
          {PRIOR_MANIFEST_RETRIEVAL_HELP_PRIMARY_ACTIONS.openAsk.label}
        </Link>
      </Button>
      <Button asChild size="sm" variant="outline">
        <Link href={PRIOR_MANIFEST_RETRIEVAL_HELP_PRIMARY_ACTIONS.architecturePackages.href}>
          {PRIOR_MANIFEST_RETRIEVAL_HELP_PRIMARY_ACTIONS.architecturePackages.label}
        </Link>
      </Button>
      {buyerPolishedShell ? null : <PageContextualHelpButton />}
      {buyerPolishedShell ? null : (
        <HelpTopicPrintButton entry={entry} allowWithoutServerPdf={entry.pdfStatus === null} />
      )}
    </div>
  );
}
