import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { QuickDecisionSummaryFindingRow } from "@/components/quick-decision-summary/QuickDecisionSummaryFindingRow";
import {
  FINDING_CLASSIFICATION_CHECKLIST_COVERAGE,
  FINDING_CLASSIFICATION_DECISION_GRADE,
} from "@/lib/findings/review-detail-findings-classification-band";
import type { QuickDecisionFinding } from "@/lib/quick-decision-summary-derive";

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...rest
  }: {
    readonly children: React.ReactNode;
    readonly href: string;
  }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

function sampleFinding(overrides: Partial<QuickDecisionFinding> = {}): QuickDecisionFinding {
  return {
    findingId: "finding-1",
    title: "Risk 1",
    recommendation: "Review",
    severityValue: 1,
    findingOrder: 0,
    aiReasoning: { wireJson: "{}", reasoningTrace: "" },
    isMuted: false,
    muteReason: null,
    enforcementTier: "PolicyViolation",
    classification: FINDING_CLASSIFICATION_DECISION_GRADE,
    ...overrides,
  };
}

const noop = (): void => {
  /* test stub */
};

const baseProps = {
  runId: "run-1",
  findings: [sampleFinding()],
  packageCommitted: true,
  providerNeutralWorkItems: false,
  workspaceCardMode: false,
} as const;

describe("QuickDecisionSummaryFindingRow semantic support band (QR-29 / AS-061)", () => {
  it("shows semantic support band beside provenance for decision-grade rows", () => {
    render(
      <ul>
        <QuickDecisionSummaryFindingRow
          props={baseProps}
          finding={sampleFinding({ semanticSupportBand: "Supported" })}
          showTierBadge={false}
          canMutate={false}
          askFindingId={null}
          onToggleAskPanel={noop}
          onViewReasoning={noop}
          onMute={noop}
        />
      </ul>,
    );

    expect(screen.getByTestId("working-finding-semantic-support-band")).toBeInTheDocument();
    expect(screen.getByTestId(/^finding-trust-chip-/)).toBeInTheDocument();
    expect(screen.getByTestId("finding-semantic-support-band-tag-finding-1")).toHaveTextContent("Supported");
  });

  it.each([
    ["Supported", "Supported"],
    ["Unchecked", "Not yet scored"],
    ["Unsupported", "Unsupported"],
    [undefined, "Not scored"],
  ] as const)("renders %s as %s on decision-grade rows", (wireBand, label) => {
    render(
      <ul>
        <QuickDecisionSummaryFindingRow
          props={baseProps}
          finding={sampleFinding({ semanticSupportBand: wireBand })}
          showTierBadge={false}
          canMutate={false}
          askFindingId={null}
          onToggleAskPanel={noop}
          onViewReasoning={noop}
          onMute={noop}
        />
      </ul>,
    );

    expect(screen.getByTestId("finding-semantic-support-band-tag-finding-1")).toHaveTextContent(label);
  });

  it("omits semantic support band chip for checklist coverage rows", () => {
    render(
      <ul>
        <QuickDecisionSummaryFindingRow
          props={baseProps}
          finding={sampleFinding({
            classification: FINDING_CLASSIFICATION_CHECKLIST_COVERAGE,
            semanticSupportBand: "Supported",
          })}
          showTierBadge={false}
          canMutate={false}
          askFindingId={null}
          onToggleAskPanel={noop}
          onViewReasoning={noop}
          onMute={noop}
        />
      </ul>,
    );

    expect(screen.queryByTestId("working-finding-semantic-support-band")).toBeNull();
  });
});
