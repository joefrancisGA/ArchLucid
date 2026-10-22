import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { PackagePrintButton } from "@/components/reviews/PackagePrintButton";
import { PACKAGE_PRINT_BUTTON_LABEL } from "@/lib/package-print-view";

describe("PackagePrintButton (TB-2205)", () => {
  it("calls window.print", () => {
    const printMock = vi.spyOn(window, "print").mockImplementation(() => {});

    render(
      <PackagePrintButton
        runId="aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"
        manifestVersion="manifest-1"
      />,
    );

    fireEvent.click(screen.getByTestId("package-print-pdf"));

    expect(screen.getByTestId("package-print-pdf")).toHaveTextContent(PACKAGE_PRINT_BUTTON_LABEL);
    expect(printMock).toHaveBeenCalledTimes(1);
    printMock.mockRestore();
  });
});
