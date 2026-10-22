import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";

import { ItsmOutboundCreateIssueDialog } from "@/components/itsm/ItsmOutboundCreateIssueDialog";

const listItsmFindingCorrelations = vi.fn();
const createItsmOutboundIssue = vi.fn();
const useItsmNativeCreateEnabled = vi.fn(() => true);
const showSuccess = vi.fn();

vi.mock("@/lib/api/itsm-outbound-api", () => ({
  listItsmFindingCorrelations: (...args: unknown[]) => listItsmFindingCorrelations(...args),
  createItsmOutboundIssue: (...args: unknown[]) => createItsmOutboundIssue(...args),
}));

vi.mock("@/lib/use-itsm-native-create-enabled", () => ({
  useItsmNativeCreateEnabled: () => useItsmNativeCreateEnabled(),
}));

vi.mock("@/lib/toast", () => ({
  showSuccess: (...args: unknown[]) => showSuccess(...args),
}));

describe("ItsmOutboundCreateIssueDialog", () => {
  beforeEach(() => {
    listItsmFindingCorrelations.mockReset();
    createItsmOutboundIssue.mockReset();
    useItsmNativeCreateEnabled.mockReset();
    showSuccess.mockReset();
    useItsmNativeCreateEnabled.mockReturnValue(true);
    listItsmFindingCorrelations.mockResolvedValue({ correlations: [] });
  });

  it("renders nothing when native ITSM create is disabled", () => {
    useItsmNativeCreateEnabled.mockReturnValue(false);

    const { container } = render(<ItsmOutboundCreateIssueDialog findingId="finding-001" />);

    expect(container).toBeEmptyDOMElement();
  });

  it("opens a provider modal and creates a linked issue", async () => {
    createItsmOutboundIssue.mockResolvedValue({
      provider: "ServiceNow",
      externalKey: "INC0012345",
    });

    render(<ItsmOutboundCreateIssueDialog findingId="finding-001" prominent />);

    await waitFor(() => {
      expect(listItsmFindingCorrelations).toHaveBeenCalledWith("finding-001");
    });

    fireEvent.click(screen.getByTestId("itsm-create-issue-open"));
    expect(screen.getByTestId("itsm-create-issue-dialog")).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("itsm-create-provider-select"));
    fireEvent.click(await screen.findByText("ServiceNow"));

    fireEvent.click(screen.getByTestId("itsm-create-issue-submit"));

    await waitFor(() => {
      expect(createItsmOutboundIssue).toHaveBeenCalledWith("finding-001", "ServiceNow");
    });

    expect(showSuccess).toHaveBeenCalledWith("ServiceNow issue created: INC0012345");
  });
});
