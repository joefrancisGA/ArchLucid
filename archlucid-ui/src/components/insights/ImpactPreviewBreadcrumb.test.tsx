import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { IMPACT_PREVIEW_PAGE_TITLE } from "@/lib/impact-preview-page-copy";

import { ImpactPreviewBreadcrumb } from "./ImpactPreviewBreadcrumb";

describe("ImpactPreviewBreadcrumb", () => {
  it("defers to page titles after TB-2090 breadcrumb removal", () => {
    render(<ImpactPreviewBreadcrumb />);

    expect(screen.queryByTestId("impact-preview-breadcrumb")).not.toBeInTheDocument();
    expect(IMPACT_PREVIEW_PAGE_TITLE.length).toBeGreaterThan(0);
  });
});
