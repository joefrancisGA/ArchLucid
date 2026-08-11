import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PackagePrintOpenButton } from "@/components/reviews/PackagePrintOpenButton";
import { PACKAGE_PRINT_OPEN_LABEL } from "@/lib/package-print-view";

describe("PackagePrintOpenButton (TB-2205)", () => {
  it("links to the package print route", () => {
    render(<PackagePrintOpenButton runId="aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa" />);

    const link = screen.getByTestId("package-print-open");

    expect(link).toHaveAttribute(
      "href",
      "/architecture/reviews/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa/print",
    );
    expect(link).toHaveTextContent(PACKAGE_PRINT_OPEN_LABEL);
  });
});
