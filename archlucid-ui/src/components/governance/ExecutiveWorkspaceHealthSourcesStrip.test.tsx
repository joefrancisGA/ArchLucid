import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ExecutiveWorkspaceHealthSourcesStrip } from "@/components/governance/ExecutiveWorkspaceHealthSourcesStrip";
import { EXECUTIVE_WORKSPACE_HEALTH_SOURCES } from "@/lib/executive-workspace-health-page-copy";

describe("ExecutiveWorkspaceHealthSourcesStrip", () => {
  it("lists follow-up Sources without self-linking the dashboard", () => {
    render(<ExecutiveWorkspaceHealthSourcesStrip />);

    expect(screen.getByTestId("executive-workspace-health-sources")).toBeInTheDocument();
    expect(screen.getByTestId("executive-workspace-health-claim-discipline")).toBeInTheDocument();
    expect(screen.getByText(/not a signed-review diligence/i)).toBeInTheDocument();

    const sources = screen.getByTestId("executive-workspace-health-sources");

    for (const link of EXECUTIVE_WORKSPACE_HEALTH_SOURCES) {
      expect(within(sources).getByRole("link", { name: link.label })).toHaveAttribute("href", link.href);
    }

    expect(within(sources).queryByRole("link", { name: /workspace overview/i })).toBeNull();
  });
});
