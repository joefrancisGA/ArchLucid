import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { IMPACT_PREVIEW_PAGE_TITLE } from "@/lib/impact-preview-page-copy";

import { ImpactPreviewBreadcrumb } from "./ImpactPreviewBreadcrumb";

describe("ImpactPreviewBreadcrumb", () => {
  it("renders insights trail ending on Impact preview", () => {
    render(<ImpactPreviewBreadcrumb />);

    expect(screen.getByTestId("impact-preview-breadcrumb")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Insights" })).toHaveAttribute("href", "/insights/evidence-graph");
    expect(screen.getByText(IMPACT_PREVIEW_PAGE_TITLE)).toBeInTheDocument();
  });
});
