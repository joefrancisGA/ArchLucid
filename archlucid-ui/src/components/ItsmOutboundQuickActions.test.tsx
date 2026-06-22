import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";

import { ItsmOutboundQuickActions } from "./ItsmOutboundQuickActions";

const listItsmFindingCorrelations = vi.fn();
const createItsmOutboundIssue = vi.fn();
const useItsmNativeCreateEnabled = vi.fn(() => true);

vi.mock("@/lib/api/itsm-outbound-api", () => ({
  listItsmFindingCorrelations: (...args: unknown[]) => listItsmFindingCorrelations(...args),
  createItsmOutboundIssue: (...args: unknown[]) => createItsmOutboundIssue(...args),
}));

vi.mock("@/lib/use-itsm-native-create-enabled", () => ({
  useItsmNativeCreateEnabled: () => useItsmNativeCreateEnabled(),
}));

describe("ItsmOutboundQuickActions", () => {
  beforeEach(() => {
    listItsmFindingCorrelations.mockReset();
    createItsmOutboundIssue.mockReset();
    useItsmNativeCreateEnabled.mockReset();
    useItsmNativeCreateEnabled.mockReturnValue(true);
    listItsmFindingCorrelations.mockResolvedValue({ correlations: [] });
  });

  it("renders one-click Jira and ServiceNow actions", async () => {
    render(<ItsmOutboundQuickActions findingId="finding-001" />);

    expect(await screen.findByTestId("itsm-sync-jira")).toHaveTextContent("Create Jira issue");
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
      expect(listItsmFindingCorrelations).toHaveBeenCalled();
    });

    expect(container).toBeEmptyDOMElement();
    expect(screen.queryByTestId("itsm-sync-jira")).not.toBeInTheDocument();
  });
});
