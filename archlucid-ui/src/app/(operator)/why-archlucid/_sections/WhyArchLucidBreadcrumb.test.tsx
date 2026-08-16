import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { WHY_ARCHLUCID_PAGE_TITLE } from "@/lib/why-archlucid-page-copy";

import { WhyArchLucidBreadcrumb } from "./WhyArchLucidBreadcrumb";

describe("WhyArchLucidBreadcrumb", () => {
  it("renders Help trail ending on Pilot proof telemetry", () => {
    render(<WhyArchLucidBreadcrumb />);

    expect(screen.getByTestId("why-archlucid-page-breadcrumb")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Help" })).toHaveAttribute("href", "/help");
    expect(screen.getByText(WHY_ARCHLUCID_PAGE_TITLE)).toBeInTheDocument();
  });
});
