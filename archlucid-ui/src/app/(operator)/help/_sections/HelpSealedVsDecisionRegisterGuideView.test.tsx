import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { HelpSealedVsDecisionRegisterGuideView } from "@/app/(operator)/help/_sections/HelpSealedVsDecisionRegisterGuideView";
import { getProductDocumentationEntry } from "@/lib/product-documentation-registry";

vi.mock("@/app/(operator)/help/HelpTopicHashScroll", () => ({
  HelpTopicHashScroll: () => null,
}));

vi.mock("@/components/help/SponsorSendPathHonestyPanel", () => ({
  SponsorSendPathHonestyPanel: () => null,
}));

describe("HelpSealedVsDecisionRegisterGuideView", () => {
  it("links both surfaces and explains seal integrity", () => {
    const entry = getProductDocumentationEntry("sealed-record-vs-decision-register");

    if (entry === undefined) {
      throw new Error("Expected sealed-record-vs-decision-register documentation entry.");
    }

    render(<HelpSealedVsDecisionRegisterGuideView entry={entry} />);

    expect(screen.getByRole("link", { name: "Open sealed review records" })).toHaveAttribute(
      "href",
      "/governance/sealed-records",
    );
    expect(screen.getByRole("link", { name: "Open the decision register" })).toHaveAttribute(
      "href",
      "/governance/decision-register",
    );
    expect(screen.getByRole("heading", { name: "What a seal proves" })).toBeInTheDocument();
    expect(screen.getByText(/does not prove that later workspace decisions are unchanged/i)).toBeInTheDocument();
  });
});
