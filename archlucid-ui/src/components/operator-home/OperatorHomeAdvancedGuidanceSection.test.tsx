import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { OperatorHomeAdvancedGuidanceSection } from "@/components/operator-home/OperatorHomeAdvancedGuidanceSection";
import {
  OPERATOR_HOME_ADVANCED_GUIDANCE_TITLE,
  OPERATOR_HOME_EXPLORE_REVIEW_WALKTHROUGH_HEADING,
} from "@/lib/buyer-polish-copy";

vi.mock("@/lib/cto-demo-presenter-pack", () => ({
  isCtoDemoOperatorToolingEnv: () => false,
}));

describe("OperatorHomeAdvancedGuidanceSection", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("buyer-polished shell shows Explore ArchLucid rows without demo readiness controls", async () => {
    render(<OperatorHomeAdvancedGuidanceSection buyerPolishedShell />);

    expect(screen.getByRole("heading", { name: OPERATOR_HOME_ADVANCED_GUIDANCE_TITLE })).toBeInTheDocument();
    expect(screen.queryByText("How ArchLucid works")).toBeNull();
    expect(screen.queryByTestId("buyer-cto-demo-readiness-panel")).toBeNull();
    expect(screen.queryByText("Demo readiness")).toBeNull();

    const expand = screen.getByRole("button", { name: /expand explore archlucid/i });
    expand.click();

    await waitFor(() => {
      expect(screen.getByTestId("explore-archlucid-buyer-content")).toBeInTheDocument();
    });
    expect(screen.getByRole("heading", { name: OPERATOR_HOME_EXPLORE_REVIEW_WALKTHROUGH_HEADING })).toBeInTheDocument();
    expect(screen.getByTestId("explore-archlucid-walkthrough-row")).toBeInTheDocument();
    expect(screen.queryByTestId("core-pilot-checklist")).toBeNull();
  });

  it("full operator shell keeps the core pilot checklist without buyer explore rows", async () => {
    render(<OperatorHomeAdvancedGuidanceSection buyerPolishedShell={false} checklistVariant="compact" />);

    expect(screen.queryByTestId("explore-archlucid-buyer-content")).toBeNull();

    const expand = screen.getByRole("button", { name: /expand explore archlucid/i });
    expand.click();

    await waitFor(() => {
      expect(screen.getByTestId("core-pilot-checklist")).toBeInTheDocument();
    });
    expect(screen.queryByTestId("start-cto-demo-card")).toBeNull();
  });
});
