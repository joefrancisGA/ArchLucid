import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const pushMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
  usePathname: () => "/governance/advisory-scans",
}));

vi.mock("@/hooks/use-operate-capability", () => ({
  useOperateCapability: () => true,
}));

vi.mock("./AdvisoryScansContent", () => ({
  AdvisoryScansContent: () => <div>Scans panel</div>,
}));

vi.mock("./AdvisorySchedulesContent", () => ({
  AdvisorySchedulesContent: () => <div>Schedules panel</div>,
}));

import { AdvisoryHubClient } from "./AdvisoryHubClient";

describe("AdvisoryHubClient (TB-670)", () => {
  it("uses shared Tabs with linked tabpanels and keyboard roving", () => {
    render(<AdvisoryHubClient initialTab="scans" />);

    const scansTab = screen.getByRole("tab", { name: "Scans" });
    const schedulesTab = screen.getByRole("tab", { name: "Schedules" });

    expect(scansTab).toHaveAttribute("aria-selected", "true");
    expect(scansTab).toHaveAttribute("aria-controls");
    expect(screen.getByText("Scans panel")).toBeInTheDocument();

    fireEvent.click(schedulesTab);

    expect(pushMock).toHaveBeenCalledWith("/governance/advisory-scans?tab=schedules");
    expect(schedulesTab).toHaveAttribute("aria-selected", "true");
    expect(screen.getByText("Schedules panel")).toBeInTheDocument();

    fireEvent.keyDown(screen.getByRole("tablist", { name: "Advisory hub sections" }), {
      key: "ArrowLeft",
    });

    expect(scansTab).toHaveFocus();
  });
});
