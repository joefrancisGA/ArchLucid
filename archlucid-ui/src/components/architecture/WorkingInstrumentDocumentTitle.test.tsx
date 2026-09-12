import { render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { WorkingInstrumentDocumentTitle } from "@/components/architecture/WorkingInstrumentDocumentTitle";

const workspaceModeMock = vi.hoisted(() => ({ isWorkingMode: true }));

vi.mock("@/components/WorkspaceModeProvider", () => ({
  useWorkspaceMode: () => workspaceModeMock,
}));

describe("WorkingInstrumentDocumentTitle (SG-036 / SY-61)", () => {
  beforeEach(() => {
    workspaceModeMock.isWorkingMode = true;
    document.title = "Architecture Review Detail";
  });

  it("sets the browser tab to the architecture display name with a review suffix", () => {
    render(
      <WorkingInstrumentDocumentTitle
        architectureDisplayName="Payments platform"
        parentArchitectureId="arch-001"
      />,
    );

    expect(document.title).toBe("Payments platform · Review");
  });

  it("leaves the tab unchanged on Guided mode", () => {
    workspaceModeMock.isWorkingMode = false;

    render(
      <WorkingInstrumentDocumentTitle
        architectureDisplayName="Payments platform"
        parentArchitectureId="arch-001"
      />,
    );

    expect(document.title).toBe("Architecture Review Detail");
  });
});
