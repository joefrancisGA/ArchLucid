import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ArchitectureIntelligenceBreadcrumb } from "./ArchitectureIntelligenceBreadcrumb";

vi.mock("@/components/WorkspaceModeProvider", () => ({
  useWorkspaceMode: () => ({
    mode: "guided",
    mounted: true,
    accountSyncState: "synced",
    isWorkingMode: false,
    setAndPersist: vi.fn(),
  }),
}));

describe("ArchitectureIntelligenceBreadcrumb", () => {
  it("renders nothing (TB-2090 system-wide breadcrumb removal)", () => {
    const { container } = render(<ArchitectureIntelligenceBreadcrumb />);

    expect(container).toBeEmptyDOMElement();
  });
});
