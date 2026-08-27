import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { HelpProductGuide } from "./HelpProductGuide";

vi.mock("@/components/operator/OperatorNavAuthorityProvider", () => ({
  useOperatorNavAuthority: () => ({
    callerAuthorityRank: 1,
    isAuthorityLoading: false,
    currentPrincipal: { authorityRank: 1 },
  }),
  useNavCallerAuthorityRank: () => 1,
}));

describe("HelpProductGuide", () => {
  it("surfaces getting started, completed-package guidance, and deep links", () => {
    render(<HelpProductGuide />);

    expect(screen.getByRole("heading", { name: "Using ArchLucid" })).toBeInTheDocument();
    expect(screen.getAllByText("Getting started").length).toBeGreaterThan(0);
    expect(screen.getByText("Working with a completed review")).toBeInTheDocument();

    expect(screen.getByRole("link", { name: "Start a review" })).toHaveAttribute("href", "/architecture/reviews/new");
    expect(screen.getByRole("link", { name: "Open sponsor report" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Ask" })).toHaveAttribute("href", "/insights/ask-review-questions");
    expect(screen.getByRole("link", { name: "Sign in" })).toHaveAttribute("href", "/auth/signin");
    expect(screen.getByRole("link", { name: "Open full troubleshooting guide" })).toHaveAttribute(
      "href",
      "/help/troubleshooting",
    );
  });

  it("shows only featured guide cards by default", () => {
    render(<HelpProductGuide />);

    expect(screen.getByRole("link", { name: /^Cloud connections/i })).toHaveAttribute(
      "href",
      "/help/cloud-connections",
    );
    expect(screen.queryByRole("link", { name: "CLI usage" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Architect workspace map" })).not.toBeInTheDocument();
  });
});
