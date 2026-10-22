import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const workspaceModeMock = vi.hoisted(() => ({ isWorkingMode: false }));

vi.mock("@/components/WorkspaceModeProvider", () => ({
  useWorkspaceMode: () => workspaceModeMock,
}));

vi.mock("@/components/operator/ArchitectureObjectMapStrip", () => ({
  ArchitectureObjectMapStrip: (props: { focus: string }) => (
    <div data-testid="architecture-object-map-strip" data-focus={props.focus} />
  ),
}));

import { ArchitecturesHubObjectMapStrip } from "./ArchitecturesHubObjectMapStrip";

describe("ArchitecturesHubObjectMapStrip (CA-25)", () => {
  beforeEach(() => {
    workspaceModeMock.isWorkingMode = false;
  });

  it("focuses draft teaching in Guided mode", () => {
    render(<ArchitecturesHubObjectMapStrip />);

    expect(screen.getByTestId("architecture-object-map-strip")).toHaveAttribute("data-focus", "draft");
  });

  it("focuses architecture portfolio in Working mode", () => {
    workspaceModeMock.isWorkingMode = true;

    render(<ArchitecturesHubObjectMapStrip />);

    expect(screen.getByTestId("architecture-object-map-strip")).toHaveAttribute("data-focus", "architecture");
  });
});
