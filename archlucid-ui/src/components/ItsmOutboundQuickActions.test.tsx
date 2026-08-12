import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";

import { ItsmOutboundQuickActions } from "./ItsmOutboundQuickActions";
import { resetItsmFindingCorrelationsStoreForTests } from "@/lib/itsm/itsm-finding-correlations-store";

const listItsmFindingCorrelationsBatch = vi.fn();
const createItsmOutboundIssue = vi.fn();
const useItsmNativeCreateEnabled = vi.fn(() => true);

vi.mock("@/lib/api/itsm-outbound-api", () => ({
  listItsmFindingCorrelationsBatch: (...args: unknown[]) => listItsmFindingCorrelationsBatch(...args),
  createItsmOutboundIssue: (...args: unknown[]) => createItsmOutboundIssue(...args),
}));

vi.mock("@/lib/use-itsm-native-create-enabled", () => ({
  useItsmNativeCreateEnabled: () => useItsmNativeCreateEnabled(),
}));

describe("ItsmOutboundQuickActions", () => {
  beforeEach(() => {
    resetItsmFindingCorrelationsStoreForTests();
    listItsmFindingCorrelationsBatch.mockReset();
    createItsmOutboundIssue.mockReset();
    useItsmNativeCreateEnabled.mockReset();
    useItsmNativeCreateEnabled.mockReturnValue(true);
    listItsmFindingCorrelationsBatch.mockResolvedValue({ findings: [{ findingId: "finding-001", correlations: [] }] });
  });

  it("renders one-click Jira and ServiceNow actions", async () => {
    render(<ItsmOutboundQuickActions findingId="finding-001" />);

    expect(await screen.findByTestId("itsm-sync-jira")).toHaveTextContent("Create Jira issue");
    expect(screen.getByTestId("itsm-sync-azure-boards")).toHaveTextContent("Create Azure Boards work item");
    expect(screen.getByTestId("itsm-sync-servicenow")).toHaveTextContent("Create ServiceNow incident");
  });

  it("creates a linked Jira issue and reloads correlations", async () => {
    createItsmOutboundIssue.mockResolvedValue({
      provider: "Jira",
      externalKey: "ARCH-42",
    });

    render(<ItsmOutboundQuickActions findingId="finding-001" compact />);

    await screen.findByTestId("itsm-sync-jira");
    fireEvent.click(screen.getByTestId("itsm-sync-jira"));

    await waitFor(() => {
      expect(createItsmOutboundIssue).toHaveBeenCalledWith("finding-001", "Jira");
    });

    expect(await screen.findByText("Jira: ARCH-42")).toBeInTheDocument();
  });

  it("hides create actions when native ITSM create is disabled and no correlations exist", async () => {
    useItsmNativeCreateEnabled.mockReturnValue(false);

    const { container } = render(<ItsmOutboundQuickActions findingId="finding-001" />);

    await waitFor(() => {
      expect(listItsmFindingCorrelationsBatch).toHaveBeenCalled();
    });

    expect(container).toBeEmptyDOMElement();
    expect(screen.queryByTestId("itsm-sync-jira")).not.toBeInTheDocument();
  });

  it("defers correlation loading until loadWhen is true", async () => {
    render(<ItsmOutboundQuickActions findingId="finding-001" loadWhen={false} />);

    await waitFor(() => {
      expect(listItsmFindingCorrelationsBatch).not.toHaveBeenCalled();
    });
  });
});
