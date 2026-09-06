import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ArchitectureSponsorSharingPanel } from "./ArchitectureSponsorSharingPanel";
import {
  ARCHITECTURE_SPONSOR_PRELIMINARY_CONFIRMATION,
  ARCHITECTURE_SPONSOR_READINESS_INCOMPLETE_WARNING,
  ARCHITECTURE_SPONSOR_RESOLVE_READINESS_ACTION,
  ARCHITECTURE_SPONSOR_SHARING_PERMISSION_DENIED,
} from "@/lib/architecture/architecture-sponsor-readiness-copy";

const useOperateCapability = vi.fn(() => true);
const recordSponsorPreliminaryArchitectureShare = vi.fn();
const writeWorkItemBodyToClipboard = vi.fn();

vi.mock("@/hooks/use-operate-capability", () => ({
  useOperateCapability: () => useOperateCapability(),
}));

vi.mock("@/lib/api/architecture-sponsor-sharing-api", () => ({
  recordSponsorPreliminaryArchitectureShare: (...args: unknown[]) =>
    recordSponsorPreliminaryArchitectureShare(...args),
}));

vi.mock("@/lib/copy-finding-as-work-item", () => ({
  writeWorkItemBodyToClipboard: (...args: unknown[]) => writeWorkItemBodyToClipboard(...args),
}));

vi.mock("@/lib/toast", () => ({
  showSuccess: vi.fn(),
  showError: vi.fn(),
}));

const incompleteArchitecture = {
  runId: "run-1",
  manifestVersion: "manifest-1",
  architecture: {
    runId: "run-1",
    architectureName: "Draft platform",
    architectureOverview: "Short.",
    businessOutcome: "",
    peopleAndSystems: [],
    ownerLabel: null,
    lastUpdatedLabel: "today",
    workspaceStatus: { label: "Draft", kind: "draft", statusTagKind: "neutral" },
    assessmentInProgress: true,
    hasArtifacts: false,
  },
  architectureSourceText: "Short.",
  findings: [
    {
      findingId: "finding-1",
      title: "High risk",
      recommendation: "Fix it",
      severityValue: 4,
      findingOrder: 0,
      aiReasoning: { wireJson: "{}", reasoningTrace: "" },
      isMuted: false,
      muteReason: null,
      enforcementTier: "blocking",
    },
  ],
} as const;

describe("ArchitectureSponsorSharingPanel", () => {
  beforeEach(() => {
    useOperateCapability.mockReset();
    recordSponsorPreliminaryArchitectureShare.mockReset();
    writeWorkItemBodyToClipboard.mockReset();
    useOperateCapability.mockReturnValue(true);
    writeWorkItemBodyToClipboard.mockResolvedValue(true);
    recordSponsorPreliminaryArchitectureShare.mockResolvedValue(undefined);
  });

  it("shows preliminary-only readiness, warning, and resolve action for incomplete architecture", () => {
    render(<ArchitectureSponsorSharingPanel {...incompleteArchitecture} />);

    expect(screen.getByTestId("architecture-sponsor-readiness-status")).toHaveTextContent("Preliminary only");
    expect(screen.getByTestId("architecture-sponsor-incomplete-warning")).toHaveTextContent(
      ARCHITECTURE_SPONSOR_READINESS_INCOMPLETE_WARNING,
    );
    expect(screen.getByTestId("architecture-sponsor-resolve")).toHaveTextContent(
      ARCHITECTURE_SPONSOR_RESOLVE_READINESS_ACTION,
    );
  });

  it("requires override confirmation before preliminary sharing and records audit", async () => {
    render(<ArchitectureSponsorSharingPanel {...incompleteArchitecture} />);

    fireEvent.click(screen.getByTestId("architecture-sponsor-share-preliminary"));
    expect(screen.getByTestId("architecture-sponsor-preliminary-dialog")).toBeInTheDocument();

    const submit = screen.getByTestId("architecture-sponsor-preliminary-submit");
    expect(submit).toBeDisabled();

    fireEvent.click(screen.getByTestId("architecture-sponsor-preliminary-confirm"));
    expect(screen.getByLabelText(ARCHITECTURE_SPONSOR_PRELIMINARY_CONFIRMATION)).toBeChecked();

    fireEvent.click(submit);

    await waitFor(() => {
      expect(recordSponsorPreliminaryArchitectureShare).toHaveBeenCalledWith(
        "run-1",
        expect.objectContaining({
          overrideAcknowledged: true,
          deliveryMethod: "preliminary-draft",
        }),
      );
    });
  });

  it("demotes resolve readiness when Do this next owns the page primary", () => {
    render(<ArchitectureSponsorSharingPanel {...incompleteArchitecture} pagePrimaryOwnedElsewhere />);

    expect(screen.getByTestId("architecture-sponsor-resolve").className).toContain("border-neutral-300");
  });

  it("demotes preliminary submit when Do this next owns the page primary", () => {
    render(<ArchitectureSponsorSharingPanel {...incompleteArchitecture} pagePrimaryOwnedElsewhere />);

    fireEvent.click(screen.getByTestId("architecture-sponsor-share-preliminary"));

    expect(screen.getByTestId("architecture-sponsor-preliminary-submit").className).toContain("border-neutral-300");
  });

  it("shows permission messaging for users without sharing capability", () => {
    useOperateCapability.mockReturnValue(false);

    render(<ArchitectureSponsorSharingPanel {...incompleteArchitecture} />);

    expect(screen.getByText(ARCHITECTURE_SPONSOR_SHARING_PERMISSION_DENIED)).toBeInTheDocument();
    expect(screen.queryByTestId("architecture-sponsor-share-preliminary")).not.toBeInTheDocument();
  });

  it("renders preliminary watermark preview in the share dialog", () => {
    render(<ArchitectureSponsorSharingPanel {...incompleteArchitecture} />);

    fireEvent.click(screen.getByTestId("architecture-sponsor-share-preliminary"));

    expect(screen.getByTestId("architecture-sponsor-preliminary-watermark")).toHaveTextContent("Preliminary draft");
    expect(screen.getByTestId("architecture-sponsor-preliminary-watermark")).toHaveTextContent("Not approved");
  });
});
