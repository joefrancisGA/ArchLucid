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
  AdvisoryScansContent: (props: { initialRunId?: string | null }) => (
    <div>Scans panel{props.initialRunId ? ` (${props.initialRunId})` : ""}</div>
  ),
}));

vi.mock("./AdvisorySchedulesContent", () => ({
  AdvisorySchedulesContent: () => <div>Schedules panel</div>,
}));

import {
  ADVISORY_SCANS_HOW_IT_WORKS_BODY,
  ADVISORY_SCANS_PAGE_LEAD,
  ADVISORY_SCANS_PAGE_VALUE_STATEMENT,
  ADVISORY_SCANS_TRUST_COPY,
} from "@/lib/advisory-copy";

import { AdvisoryHubClient } from "./AdvisoryHubClient";

describe("AdvisoryHubClient (TB-670)", () => {
  it("shows one primary description above the fold (TB-1125)", () => {
    render(<AdvisoryHubClient initialTab="scans" />);

    expect(screen.getByTestId("advisory-scans-page-lead")).toHaveTextContent(ADVISORY_SCANS_PAGE_LEAD);

    const howItWorks = screen.getByTestId("advisory-scans-how-it-works");

    expect(howItWorks).toBeInTheDocument();
    expect(howItWorks).not.toHaveAttribute("open");
    expect(screen.queryByText(ADVISORY_SCANS_PAGE_VALUE_STATEMENT)).not.toBeInTheDocument();
    expect(screen.queryByText(ADVISORY_SCANS_TRUST_COPY)).not.toBeInTheDocument();
    expect(screen.getByText(ADVISORY_SCANS_HOW_IT_WORKS_BODY)).toBeInTheDocument();
  });

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

  it("preserves runId when switching advisory tabs", () => {
    render(<AdvisoryHubClient initialTab="scans" initialRunId="run-abc" />);

    expect(screen.getByText("Scans panel (run-abc)")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("tab", { name: "Schedules" }));

    expect(pushMock).toHaveBeenCalledWith("/governance/advisory-scans?tab=schedules&runId=run-abc");
  });

  it("keeps ?tab=scans when selecting the Scans tab (TB-1565)", () => {
    render(<AdvisoryHubClient initialTab="schedules" />);

    fireEvent.click(screen.getByRole("tab", { name: "Scans" }));

    expect(pushMock).toHaveBeenCalledWith("/governance/advisory-scans?tab=scans");
  });
});
