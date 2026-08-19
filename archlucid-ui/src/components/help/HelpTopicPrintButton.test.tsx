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

  it("calls window.print for customer-tier docs", () => {
    const printMock = vi.spyOn(window, "print").mockImplementation(() => {});

    render(<HelpTopicPrintButton entry={entry("customer")} />);

    fireEvent.click(screen.getByTestId("help-topic-print-pdf"));

    expect(printMock).toHaveBeenCalledTimes(1);
    printMock.mockRestore();
  });

  it("renders nothing when pdfStatus is null", () => {
    const { container } = render(<HelpTopicPrintButton entry={entry(null)} />);

    expect(container).toBeEmptyDOMElement();
  });

  it("calls window.print when allowWithoutServerPdf is set and pdfStatus is null", () => {
    const printMock = vi.spyOn(window, "print").mockImplementation(() => {});

    render(<HelpTopicPrintButton entry={entry(null)} allowWithoutServerPdf />);

    fireEvent.click(screen.getByTestId("help-topic-print-pdf"));

    expect(printMock).toHaveBeenCalledTimes(1);
    printMock.mockRestore();
  });
});
