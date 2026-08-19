import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { HelpTopicPdfDownloadButton } from "@/components/help/HelpTopicPdfDownloadButton";
import type { ProductDocumentationEntry } from "@/lib/product-documentation-registry";

function entry(pdfStatus: ProductDocumentationEntry["pdfStatus"]): ProductDocumentationEntry {
  return {
    slug: "cloud-connections-azure",
    title: "Azure cloud connections",
    summary: "Connect Azure securely.",
    audience: "operator",
    sourcePaths: ["docs/library/customer-facing/CLOUD_CONNECTIONS.md"],
    pdfStatus,
    contentKind: "product-help",
  };
}

describe("HelpTopicPdfDownloadButton (TB-726)", () => {
  it("links public PDFs to the static docs-pdf path", () => {
    render(<HelpTopicPdfDownloadButton entry={entry("public")} />);

    const link = screen.getByTestId("help-topic-download-pdf");
    expect(link).toHaveAttribute("href", "/docs-pdf/cloud-connections-azure.pdf");
  });

  it("renders an authenticated download button for customer PDFs", () => {
    render(<HelpTopicPdfDownloadButton entry={entry("customer")} />);

    expect(screen.getByTestId("help-topic-download-pdf")).toHaveTextContent("Download PDF");
  });

  it("renders nothing when pdfStatus is null", () => {
    const { container } = render(<HelpTopicPdfDownloadButton entry={entry(null)} />);

    expect(container).toBeEmptyDOMElement();
  });
});
