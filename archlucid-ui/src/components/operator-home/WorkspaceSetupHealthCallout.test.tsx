import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { WorkspaceSetupHealthCallout } from "@/components/operator-home/WorkspaceSetupHealthCallout";

describe("WorkspaceSetupHealthCallout", () => {
  it("uses concise unknown-setup copy without duplicated troubleshooting phrases", () => {
    render(
      <WorkspaceSetupHealthCallout
        presentation={{
          tone: "unknown",
          label: "Workspace setup incomplete",
          isHealthy: false,
        }}
      />,
    );

    expect(screen.getByText("Workspace setup incomplete")).toBeInTheDocument();
    expect(screen.getByText(/Some workspace services are unavailable\./)).toBeInTheDocument();
    expect(screen.queryByText(/Open troubleshooting or review system health\./)).toBeNull();
    expect(screen.getByRole("link", { name: "Open troubleshooting" })).toHaveAttribute(
      "href",
      "/help/troubleshooting",
    );
    expect(screen.getByRole("link", { name: "system health" })).toHaveAttribute("href", "/administration/system-health");
  });
});
