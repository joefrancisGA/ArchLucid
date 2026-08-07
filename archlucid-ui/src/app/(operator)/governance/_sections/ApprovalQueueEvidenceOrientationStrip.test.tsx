import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ApprovalQueueEvidenceOrientationStrip } from "@/app/(operator)/governance/_sections/ApprovalQueueEvidenceOrientationStrip";
import {
  APPROVAL_QUEUE_CANONICAL_PATH,
  APPROVAL_QUEUE_SOURCES,
} from "@/lib/approval-queue-evidence-copy";

describe("ApprovalQueueEvidenceOrientationStrip", () => {
  it("lists follow-up Sources without self-linking the approval queue", () => {
    render(<ApprovalQueueEvidenceOrientationStrip />);

    expect(screen.getByTestId("approval-queue-sources")).toBeInTheDocument();
    expect(screen.getByTestId("approval-queue-claim-discipline")).toBeInTheDocument();

    for (const link of APPROVAL_QUEUE_SOURCES) {
      expect(screen.getByRole("link", { name: link.label })).toHaveAttribute("href", link.href);
    }

    expect(APPROVAL_QUEUE_SOURCES.some((link) => link.href === APPROVAL_QUEUE_CANONICAL_PATH)).toBe(
      false,
    );
  });
});
