import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ContextualHelpDrawerBreadcrumb } from "./ContextualHelpDrawerBreadcrumb";
import { OPERATOR_NAV_LINK_LABELS } from "@/lib/i18n";

describe("ContextualHelpDrawerBreadcrumb", () => {
  it("links Home and marks Contextual help as current", () => {
    render(<ContextualHelpDrawerBreadcrumb />);

    expect(screen.getByTestId("contextual-help-drawer-breadcrumb")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: OPERATOR_NAV_LINK_LABELS.home })).toHaveAttribute("href", "/");
    expect(screen.getByText("Contextual help")).toBeInTheDocument();
  });
});
