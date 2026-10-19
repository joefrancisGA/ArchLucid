import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { decisionRegisterNextReviewHref } from "@/app/(operator)/governance/decision-register/DecisionRegisterNextReviewFooter";
import { GOVERNANCE_DECISION_REGISTER_PATH } from "@/lib/governance/governance-route-paths";
import type { FindingDispositionKind } from "@/lib/api/governance-stickiness-api";

import {
  FindingInspectDispositionForm,
  type FindingInspectDispositionFormProps,
} from "./FindingInspectDispositionForm";

function buildDispositionFormProps(
  overrides: Partial<FindingInspectDispositionFormProps> = {},
): FindingInspectDispositionFormProps {
  const noop = vi.fn();

  return {
    findingId: "finding-1",
    runId: "run-1",
    canMutate: true,
    assignedToUserId: "",
    setAssignedToUserId: noop,
    remediationDueUtc: "",
    setRemediationDueUtc: noop,
    disposition: "Accepted" as FindingDispositionKind,
    setDisposition: noop,
    rationale: "",
    setRationale: noop,
    revisitDueUtc: "",
    setRevisitDueUtc: noop,
    evidenceRequestText: "",
    setEvidenceRequestText: noop,
    remediationOwnerError: null,
    setRemediationOwnerError: noop,
    busyAction: null,
    pendingDispositionConfirm: null,
    setPendingDispositionConfirm: noop,
    applyChangePreviewOverride: false,
    setApplyChangePreviewOverride: noop,
    tradeOffAcknowledgment: "",
    setTradeOffAcknowledgment: noop,
    architectRestatement: "",
    setArchitectRestatement: noop,
    showIncrementalRereviewLink: false,
    submitRemediationAssignment: noop,
    submitDisposition: noop,
    submitExplicitRemediation: noop,
    currentDisposition: "None",
    mutationDisabledHintId: "finding-disposition-mutation-disabled",
    mutationDisabledReason: null,
    pendingDispositionKind: "Accepted",
    pendingDispositionBlockedReason: null,
    remediationLastSavedUtc: null,
    remediationInlineSaveError: null,
    dispositionLastSavedUtc: null,
    dispositionInlineSaveError: null,
    dispositionConflict: null,
    reloadDispositionConflict: noop,
    dismissDispositionConflict: noop,
    ...overrides,
  };
}

describe("FindingInspectDispositionForm decision register link", () => {
  it("does not show the decision register link before a disposition save", () => {
    render(<FindingInspectDispositionForm {...buildDispositionFormProps()} />);

    expect(screen.queryByTestId("finding-disposition-decision-register-link")).toBeNull();
    expect(screen.queryByRole("link", { name: "See it in the decision register" })).toBeNull();
  });

  it("shows the decision register link with runId on the href after a save", () => {
    render(
      <FindingInspectDispositionForm
        {...buildDispositionFormProps({
          dispositionLastSavedUtc: "2026-10-19T12:00:00.000Z",
          runId: "run-42",
        })}
      />,
    );

    expect(screen.getByTestId("finding-disposition-last-saved")).toBeInTheDocument();
    expect(screen.getByText("Recorded on this finding. The sealed review record is unchanged.")).toBeInTheDocument();

    const link = screen.getByTestId("finding-disposition-decision-register-link");
    expect(link).toHaveTextContent("See it in the decision register");
    expect(link).toHaveAttribute("href", decisionRegisterNextReviewHref("run-42"));
  });

  it("uses the decision register path when runId is empty", () => {
    render(
      <FindingInspectDispositionForm
        {...buildDispositionFormProps({
          dispositionLastSavedUtc: "2026-10-19T12:00:00.000Z",
          runId: "   ",
        })}
      />,
    );

    const link = screen.getByTestId("finding-disposition-decision-register-link");
    expect(link).toHaveAttribute("href", GOVERNANCE_DECISION_REGISTER_PATH);
  });
});
