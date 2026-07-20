import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { HelpTopicPrintButton } from "@/components/help/HelpTopicPrintButton";
import type { ProductDocumentationEntry } from "@/lib/product-documentation-registry";

function entry(pdfStatus: ProductDocumentationEntry["pdfStatus"]): ProductDocumentationEntry {
  return {
    slug: "procurement",
    title: "Procurement",
    summary: "Buyer procurement pack.",
    audience: "operator",
    sourcePaths: ["docs/go-to-market/PROCUREMENT.md"],
    pdfStatus,
    contentKind: "security-trust",
  };
}

describe("HelpTopicPrintButton (TB-721)", () => {
  it("calls window.print for public docs", () => {
    const printMock = vi.spyOn(window, "print").mockImplementation(() => {});

    render(<HelpTopicPrintButton entry={entry("public")} />);

    fireEvent.click(screen.getByTestId("help-topic-print-pdf"));

    expect(printMock).toHaveBeenCalledTimes(1);
    printMock.mockRestore();
  });

  it("renders nothing for customer-tier docs", () => {
    const { container } = render(<HelpTopicPrintButton entry={entry("customer")} />);

    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing when pdfStatus is null", () => {
    const { container } = render(<HelpTopicPrintButton entry={entry(null)} />);

    expect(container).toBeEmptyDOMElement();
  });
});
