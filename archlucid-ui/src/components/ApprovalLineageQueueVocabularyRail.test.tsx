import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ApprovalLineageQueueVocabularyRail } from "@/components/ApprovalLineageQueueVocabularyRail";
import {
  APPROVAL_LINEAGE_QUEUE_COMPACT_LINE,
  APPROVAL_LINEAGE_QUEUE_HEADING,
  APPROVAL_LINEAGE_QUEUE_LINEAGE_LINK,
  APPROVAL_LINEAGE_QUEUE_QUEUE_LINK,
  APPROVAL_LINEAGE_QUEUE_WHY_TWO,
} from "@/lib/vocabulary/approval-lineage-queue-vocabulary";

describe("ApprovalLineageQueueVocabularyRail (TB-2271)", () => {
  it("renders lineage strip with peer link to approval queue", () => {
    render(<ApprovalLineageQueueVocabularyRail currentSurfaceId="approval-lineage" />);

    const strip = screen.getByTestId("approval-lineage-queue-vocabulary");
    expect(strip).toHaveAttribute("data-variant", "compact");
    expect(strip).toHaveAttribute("data-current-surface", "approval-lineage");
    expect(strip.textContent ?? "").toContain(APPROVAL_LINEAGE_QUEUE_COMPACT_LINE);

    const peer = screen.getByTestId("approval-lineage-queue-vocabulary-peer-link");
    expect(peer).toHaveTextContent(APPROVAL_LINEAGE_QUEUE_QUEUE_LINK.label);
    expect(peer).toHaveAttribute("href", APPROVAL_LINEAGE_QUEUE_QUEUE_LINK.href);
  });

  it("renders queue strip with peer link to approval lineage", () => {
    render(<ApprovalLineageQueueVocabularyRail currentSurfaceId="approval-queue" />);

    expect(screen.getByTestId("approval-lineage-queue-vocabulary")).toHaveAttribute(
      "data-current-surface",
      "approval-queue",
    );

    const peer = screen.getByTestId("approval-lineage-queue-vocabulary-peer-link");
    expect(peer).toHaveTextContent(APPROVAL_LINEAGE_QUEUE_LINEAGE_LINK.label);
    expect(peer).toHaveAttribute("href", APPROVAL_LINEAGE_QUEUE_LINEAGE_LINK.href);
  });

  it("renders full variant with why-two explanation", () => {
    render(
      <ApprovalLineageQueueVocabularyRail currentSurfaceId="approval-lineage" variant="full" />,
    );

    const strip = screen.getByTestId("approval-lineage-queue-vocabulary");
    expect(strip).toHaveAttribute("data-variant", "full");
    expect(screen.getByText(APPROVAL_LINEAGE_QUEUE_HEADING)).toBeInTheDocument();
    expect(screen.getByText(APPROVAL_LINEAGE_QUEUE_WHY_TWO)).toBeInTheDocument();
    expect(screen.getByTestId("approval-lineage-queue-vocabulary-current")).toHaveTextContent(
      APPROVAL_LINEAGE_QUEUE_LINEAGE_LINK.label,
    );
  });
});
