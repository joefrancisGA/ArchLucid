import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { WhyArchLucidBreadcrumb } from "@/app/(operator)/why-archlucid/_sections/WhyArchLucidBreadcrumb";
import {
  WHY_ARCHLUCID_BREADCRUMB_LEARNING_HREF,
  WHY_ARCHLUCID_BREADCRUMB_LEARNING_LABEL,
  WHY_ARCHLUCID_PAGE_TITLE,
} from "@/lib/why-archlucid-page-copy";

describe("WhyArchLucidBreadcrumb", () => {
  it("renders Help trail to Pilot proof telemetry", () => {
    render(<WhyArchLucidBreadcrumb />);

    expect(screen.getByTestId("why-archlucid-page-breadcrumb")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: WHY_ARCHLUCID_BREADCRUMB_LEARNING_LABEL })).toHaveAttribute(
      "href",
      WHY_ARCHLUCID_BREADCRUMB_LEARNING_HREF,
    );
    expect(screen.getByText(WHY_ARCHLUCID_PAGE_TITLE)).toHaveAttribute("aria-current", "page");
  });
});
