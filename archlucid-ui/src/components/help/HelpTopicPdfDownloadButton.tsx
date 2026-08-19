"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { downloadHelpTopicPdf } from "@/lib/help/help-topic-pdf-download";
import { resolvePublicHelpTopicPdfHref } from "@/lib/product-documentation-pdf-href";
import type { ProductDocumentationEntry } from "@/lib/product-documentation-registry";

type HelpTopicPdfDownloadButtonProps = {
  readonly entry: ProductDocumentationEntry;
};

export function HelpTopicPdfDownloadButton(props: HelpTopicPdfDownloadButtonProps): React.ReactElement | null {
  const { entry } = props;

  if (entry.pdfStatus === null) {
    return null;
  }

  if (entry.pdfStatus === "public") {
    return (
      <Button type="button" variant="outline" size="sm" asChild data-testid="help-topic-download-pdf">
        <a href={resolvePublicHelpTopicPdfHref(entry.slug)} download>
          Download PDF
        </a>
      </Button>
    );
  }

  if (entry.pdfStatus !== "customer") {
    return null;
  }

  return <HelpTopicCustomerPdfDownloadButton slug={entry.slug} />;
}

type HelpTopicCustomerPdfDownloadButtonProps = {
  readonly slug: string;
};

function HelpTopicCustomerPdfDownloadButton(props: HelpTopicCustomerPdfDownloadButtonProps): React.ReactElement {
  const { slug } = props;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={busy}
        data-testid="help-topic-download-pdf"
        onClick={() => {
          setBusy(true);
          setError(null);

          void downloadHelpTopicPdf(slug)
            .catch((caught: unknown) => {
              const message = caught instanceof Error ? caught.message : "Could not download PDF.";
              setError(message);
            })
            .finally(() => {
              setBusy(false);
            });
        }}
      >
        {busy ? "Downloading…" : "Download PDF"}
      </Button>
      {error !== null ? (
        <p className="m-0 text-sm text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
