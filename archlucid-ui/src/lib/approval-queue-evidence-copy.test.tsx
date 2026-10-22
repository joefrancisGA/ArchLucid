import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { expectFollowUpLink } from "@/lib/claim-discipline-test-helpers";

import { ApprovalQueueEvidenceOrientationStrip } from "@/components/evidence-orientation/registry/claim-and-sources-strips";
import {
  APPROVAL_QUEUE_CANONICAL_PATH,
  APPROVAL_QUEUE_FOLLOW_UPS_TITLE,
  APPROVAL_QUEUE_SOURCES,
  APPROVAL_QUEUE_SOURCES_INTRO,
} from "@/lib/approval-queue-evidence-copy";

describe("approval-queue-evidence-copy", () => {
  it("publishes its canonical operator path", () => {
    expect(APPROVAL_QUEUE_CANONICAL_PATH).toBe("/governance/approval-queue");
  });

  it("renders claim discipline and operator Sources follow-ups", () => {
    render(<ApprovalQueueEvidenceOrientationStrip />);

    expect(screen.queryByTestId("approval-queue-claim-discipline")).not.toBeInTheDocument();
    expect(screen.getByText(APPROVAL_QUEUE_SOURCES_INTRO)).toBeInTheDocument();

    const sources = screen.getByTestId("approval-queue-sources");

    for (const link of APPROVAL_QUEUE_SOURCES) {
      expectFollowUpLink(within(sources), link);
    }

    expect(
      within(sources).queryByRole("link", { name: new RegExp(`^${APPROVAL_QUEUE_CANONICAL_PATH}$`, "i") }),
    ).not.toBeInTheDocument();
  });

  it("labels claim discipline and follow-ups for accessibility parity", () => {
    render(<ApprovalQueueEvidenceOrientationStrip />);
    expect(screen.getByRole("heading", { name: APPROVAL_QUEUE_FOLLOW_UPS_TITLE })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /Sources package/i })).toBeNull();
  });
});
