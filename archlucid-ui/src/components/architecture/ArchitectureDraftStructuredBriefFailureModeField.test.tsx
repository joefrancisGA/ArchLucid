import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ArchitectureDraftStructuredBriefFailureModeField } from "@/components/architecture/ArchitectureDraftStructuredBriefFailureModeField";
import { emptyArchitectureDraftStructuredBrief } from "@/lib/architecture/architecture-draft-structured-brief";

describe("ArchitectureDraftStructuredBriefFailureModeField", () => {
  it("renders failure mode input", () => {
    render(
      <ArchitectureDraftStructuredBriefFailureModeField
        brief={emptyArchitectureDraftStructuredBrief()}
        onStructuredBriefChange={vi.fn()}
      />,
    );
    expect(screen.getByTestId("architecture-draft-failure-mode-input")).toBeInTheDocument();
  });
});
