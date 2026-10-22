import "./operate-authority-ui-shaping.setup.tsx";

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AlertsInboxTriageActionDialog } from "@/components/alerts/AlertsInboxDialogs";
import { AlertsInboxRankCue } from "@/components/OperateCapabilityHints";
import {
  alertsInboxRankReaderLine,
  alertsTriageDialogConfirmButtonLabelReaderRank,
} from "@/lib/enterprise-controls-context-copy";
import { useOperateCapability } from "@/hooks/use-operate-capability";

import { mutateCapability } from "./operate-authority-ui-shaping.fixtures";

/** Minimal wiring probe: production inbox passes `useOperateCapability()` into triage controls. */
function InboxTriageMutationProbe() {
  const canMutateAlertInbox = useOperateCapability();

  return (
    <AlertsInboxTriageActionDialog
      pendingAction={{ alertId: "alert-ui-shape-1", action: "Acknowledge" }}
      actionComment=""
      actionBusy={false}
      canMutateAlertInbox={canMutateAlertInbox}
      onActionCommentChange={() => {}}
      onClose={() => {}}
      onConfirm={() => {}}
    />
  );
}

describe("Enterprise authority UI shaping — alerts inbox", () => {
  it("Alerts inbox triage: Confirm stays disabled when mutation capability is false", () => {
    mutateCapability.current = false;
    render(<InboxTriageMutationProbe />);

    expect(
      screen.getByRole("button", { name: alertsTriageDialogConfirmButtonLabelReaderRank }),
    ).toBeDisabled();
  });

  it("Alerts inbox triage: Confirm enables when mutation capability is true", () => {
    mutateCapability.current = true;
    render(<InboxTriageMutationProbe />);

    expect(screen.getByRole("button", { name: "Confirm" })).not.toBeDisabled();
  });

  it("Alerts inbox: shows inbox rank cue note when mutation capability is false", () => {
    mutateCapability.current = false;
    render(<AlertsInboxRankCue />);

    expect(screen.getByText(alertsInboxRankReaderLine)).toBeInTheDocument();
    expect(screen.queryByTestId("layer-header-operate-execute-rank-cue")).toBeNull();
  });

  it("Alerts inbox: omits inbox rank cue when mutation capability is true", () => {
    mutateCapability.current = true;
    render(<AlertsInboxRankCue />);

    expect(screen.queryByTestId("layer-header-operate-execute-rank-cue")).toBeNull();
    expect(screen.queryByText(alertsInboxRankReaderLine)).toBeNull();
  });
});
