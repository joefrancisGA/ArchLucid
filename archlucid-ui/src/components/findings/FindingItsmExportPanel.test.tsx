import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const useItsmNativeCreateReadiness = vi.fn();

vi.mock("@/lib/use-itsm-native-create-enabled", () => ({
  useItsmNativeCreateReadiness: () => useItsmNativeCreateReadiness(),
  useItsmNativeCreateEnabled: () => useItsmNativeCreateReadiness().defaultPathReady,
}));

vi.mock("@/components/itsm/ItsmOutboundCreateIssueDialog", () => ({
  ItsmOutboundCreateIssueDialog: () => <button type="button">Create issue</button>,
}));

vi.mock("@/components/CopyFindingAsWorkItemButton", () => ({
  CopyFindingAsWorkItemButton: () => <button type="button">Copy work item</button>,
}));

import { FindingItsmExportPanel } from "@/components/findings/FindingItsmExportPanel";

const payload = {
  findingId: "finding-001",
  title: "Sample finding",
} as never;

describe("FindingItsmExportPanel", () => {
  it("surfaces native create as the default path when probes validate", () => {
    useItsmNativeCreateReadiness.mockReturnValue({
      defaultPathReady: true,
      deploymentEnabled: true,
      health: null,
    });

    render(<FindingItsmExportPanel runId="run-001" findingId="finding-001" payload={payload} />);

    expect(screen.getByTestId("finding-itsm-native-default-panel")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Sync to Jira, Azure Boards, or ServiceNow" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Create issue" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Copy work item" })).toBeInTheDocument();
  });

  it("falls back to copy export when native default path is not ready", () => {
    useItsmNativeCreateReadiness.mockReturnValue({
      defaultPathReady: false,
      deploymentEnabled: false,
      health: null,
    });

    render(<FindingItsmExportPanel runId="run-001" findingId="finding-001" payload={payload} />);

    expect(screen.getByTestId("finding-itsm-export-panel")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Copy for Jira, Azure Boards, or ServiceNow" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Create issue" })).not.toBeInTheDocument();
  });

  it("links to connector admin when deployment flag is on but probes are not ready", () => {
    useItsmNativeCreateReadiness.mockReturnValue({
      defaultPathReady: false,
      deploymentEnabled: true,
      health: null,
    });

    render(<FindingItsmExportPanel runId="run-001" findingId="finding-001" payload={payload} />);

    expect(screen.getByRole("link", { name: "configure connectors" })).toHaveAttribute(
      "href",
      "/administration/connection-status",
    );
  });
});
