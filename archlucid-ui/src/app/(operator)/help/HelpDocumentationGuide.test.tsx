import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { HelpDocumentationGuide } from "./HelpDocumentationGuide";

vi.mock("@/components/OperatorNavAuthorityProvider", () => ({
  useOperatorNavAuthority: () => ({
    callerAuthorityRank: 3,
    isAuthorityLoading: false,
    currentPrincipal: { authorityRank: 3 },
  }),
}));

describe("HelpDocumentationGuide (TB-734)", () => {
  it("renders documentation badges and export affordances on technical topics", () => {
    render(<HelpDocumentationGuide />);

    expect(screen.getByRole("heading", { name: "Technical documentation" })).toBeInTheDocument();
    expect(screen.getByTestId("help-documentation-topic-grid")).toBeInTheDocument();
    expect(screen.getAllByTestId("help-center-documentation-badge").length).toBeGreaterThan(0);
    expect(screen.getAllByTestId("help-topic-doc-reference-link").length).toBeGreaterThan(0);
  });

  it("exposes allowlisted internal technical documentation for admins (TB-1250)", () => {
    render(<HelpDocumentationGuide />);

    expect(screen.getByTestId("help-documentation-topic-admin-diagnostics")).toBeInTheDocument();
    expect(screen.queryByTestId("help-documentation-topic-cli-usage")).not.toBeInTheDocument();
  });

  it("does not list Admin-gated configuration-reference on the Documentation tab (TB-1329)", () => {
    render(<HelpDocumentationGuide />);

    expect(screen.queryByTestId("help-documentation-topic-configuration-reference")).not.toBeInTheDocument();
  });
});
