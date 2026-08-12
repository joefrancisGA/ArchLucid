import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { RunDetailDecisionDeltaPanel } from "@/app/(operator)/architecture/reviews/[runId]/_sections/RunDetailDecisionDeltaPanel";
import { deriveFindingTrustPresentation } from "@/lib/findings/finding-trust-presentation";
import {
  RUN_DETAIL_DECISION_DELTA_PANEL_TEST_ID,
  RUN_DETAIL_DECISION_DELTA_ROW_TEST_ID,
} from "@/lib/run-detail-decision-delta-alignment";
import type { RunDetailDecisionDeltaView } from "@/lib/run-detail-decision-delta";

describe("RunDetailDecisionDeltaPanel", () => {
  it("renders top material findings with rule badges", () => {
    const trustPresentation = deriveFindingTrustPresentation({
      policyRuleId: "net-base-001",
      evidenceRefCount: 1,
    });
    const view: RunDetailDecisionDeltaView = {
      isCommitted: true,
      emptyMessage: null,
      rows: [
        {
          rank: 1,
          findingId: "finding-1",
          title: "Missing private endpoint",
          severityLabel: "Critical",
          policyRuleId: "net-base-001",
          evidenceRefCount: 1,
          evidenceAnchorHint: "network.bicep:10 — public access enabled",
          trustChipSet: trustPresentation.chipSet,
          compareDeltaTrustLabels: {
            origin: trustPresentation.chipSet.origin,
            grounding: trustPresentation.chipSet.grounding,
          },
        },
      ],
    };

    render(<RunDetailDecisionDeltaPanel runId="run-abc" view={view} />);

    expect(screen.getByTestId(RUN_DETAIL_DECISION_DELTA_PANEL_TEST_ID)).toBeInTheDocument();
    expect(screen.getByTestId(RUN_DETAIL_DECISION_DELTA_ROW_TEST_ID)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Missing private endpoint/i })).toHaveAttribute(
      "href",
      "/architecture/reviews/run-abc/findings/finding-1",
    );
    expect(screen.getByTestId("finding-policy-rule-badge")).toHaveTextContent("net-base-001");
    expect(screen.getByTestId("finding-trust-chip-deterministic-rule")).toBeInTheDocument();
    expect(screen.getByText(/Evidence anchor:/i)).toBeInTheDocument();
  });

  it("renders empty state when no material findings", () => {
    const view: RunDetailDecisionDeltaView = {
      isCommitted: true,
      rows: [],
      emptyMessage: "No active findings recorded",
    };

    render(<RunDetailDecisionDeltaPanel runId="run-abc" view={view} />);

    expect(screen.getByTestId("run-detail-decision-delta-empty")).toHaveTextContent("No active findings");
  });
});
