"use client";

import { Button } from "@/components/ui/button";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import { DPA_TEMPLATE_HELP_DOWNLOAD_ACTION } from "@/lib/dpa-template-help-guide-content";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { resolvePublicHelpTopicPdfHref } from "@/lib/product-documentation-pdf-href";
import type { ProductDocumentationEntry } from "@/lib/product-documentation-registry";

type HelpDpaTemplateHeaderActionsProps = {
  readonly entry: ProductDocumentationEntry;
};

/** Header actions for `/help/dpa-template` (HDP). */
export function HelpDpaTemplateHeaderActions(props: HelpDpaTemplateHeaderActionsProps): React.JSX.Element {
  const { entry } = props;
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();
  const pdfHref = resolvePublicHelpTopicPdfHref(entry.slug);

  return (
    <div className="flex flex-wrap items-center gap-2" data-testid="help-dpa-template-header-actions">
      {buyerPolishedShell ? null : <PageContextualHelpButton />}
      <Button
        type="button"
        variant="primary"
        size="sm"
        asChild
        data-testid="help-dpa-template-download-pdf"
      >
        <a href={pdfHref} download>
          {DPA_TEMPLATE_HELP_DOWNLOAD_ACTION.label}
        </a>
      </Button>
    </div>
  );
}
