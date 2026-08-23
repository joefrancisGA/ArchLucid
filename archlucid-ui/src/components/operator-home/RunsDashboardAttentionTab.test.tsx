import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { RunsDashboardAttentionTab } from "@/components/operator-home/RunsDashboardAttentionTab";
import { OPERATOR_ATTENTION_KIND_LABELS } from "@/lib/operator/operator-attention-taxonomy";
import type { RunSummary } from "@/types/authority";

const attentionRun = {
  runId: "run-attention",
  projectId: "default",
  description: "Needs disposition",
  hasFindingsSnapshot: true,
  hasGoldenManifest: false,
} as RunSummary;

describe("RunsDashboardAttentionTab (TB-2369)", () => {
  it("labels home attention preview with the unfinished-work partition", () => {
    render(
      <RunsDashboardAttentionTab
        phase="ready"
        failure={null}
        runListError={false}
        filteredItems={[attentionRun]}
        attentionPartitionLabel={OPERATOR_ATTENTION_KIND_LABELS["unfinished-work"]}
        attentionPartitionId="unfinished-work"
      />,
    );

    expect(screen.getByTestId("runs-dashboard-attention-partition-label")).toHaveTextContent(
      OPERATOR_ATTENTION_KIND_LABELS["unfinished-work"],
    );
    expect(screen.getByTestId("runs-dashboard-tab-attention")).toHaveAttribute(
      "data-attention-partition",
      "unfinished-work",
    );
  });

  it("shows partition-aware copy when attention runs are already on unfinished-work rail", () => {
    render(
      <RunsDashboardAttentionTab
        phase="ready"
        failure={null}
        runListError={false}
        filteredItems={[]}
        attentionPartitionLabel={OPERATOR_ATTENTION_KIND_LABELS["unfinished-work"]}
        totalAttentionCount={2}
      />,
    );

    expect(
      screen.getByText(
        `Reviews needing attention appear in ${OPERATOR_ATTENTION_KIND_LABELS["unfinished-work"]} above.`,
      ),
    ).toBeInTheDocument();
  });
});
