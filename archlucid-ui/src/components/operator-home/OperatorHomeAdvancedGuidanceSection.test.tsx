import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { OperatorHomeAdvancedGuidanceSection } from "@/components/operator-home/OperatorHomeAdvancedGuidanceSection";
import { OPERATOR_HOME_ADVANCED_GUIDANCE_TITLE } from "@/lib/buyer/buyer-polish-copy";

vi.mock("@/lib/cto-demo-presenter-pack", () => ({
  isCtoDemoOperatorToolingEnv: () => false,
}));

describe("OperatorHomeAdvancedGuidanceSection", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("buyer-polished shell omits the advanced guidance rail (hero help covers the workflow)", () => {
    const { container } = render(<OperatorHomeAdvancedGuidanceSection buyerPolishedShell />);

    expect(container).toBeEmptyDOMElement();
    expect(screen.queryByTestId("operator-home-advanced-guidance")).toBeNull();
    expect(screen.queryByTestId("explore-archlucid-buyer-content")).toBeNull();
  });

  it("full operator shell keeps the core pilot checklist without buyer explore rows", async () => {
    render(<OperatorHomeAdvancedGuidanceSection buyerPolishedShell={false} checklistVariant="compact" />);

    expect(screen.queryByTestId("explore-archlucid-buyer-content")).toBeNull();
    expect(screen.queryByRole("link", { name: OPERATOR_HOME_ADVANCED_GUIDANCE_TITLE })).toBeNull();
    expect(screen.getByRole("heading", { name: OPERATOR_HOME_ADVANCED_GUIDANCE_TITLE })).toBeInTheDocument();

    const expand = screen.getByRole("button", { name: new RegExp(`expand ${OPERATOR_HOME_ADVANCED_GUIDANCE_TITLE}`, "i") });
    expand.click();

    await waitFor(() => {
      expect(screen.getByTestId("core-pilot-checklist")).toBeInTheDocument();
    });
    expect(screen.queryByTestId("start-cto-demo-card")).toBeNull();
    expect(screen.queryByRole("link", { name: "View workflow" })).toBeNull();
  });
});
