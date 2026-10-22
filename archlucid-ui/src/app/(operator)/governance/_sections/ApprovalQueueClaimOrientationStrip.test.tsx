import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ApprovalQueueClaimOrientationStrip } from "@/app/(operator)/governance/_sections/ApprovalQueueClaimOrientationStrip";
import { APPROVAL_QUEUE_SOURCES } from "@/lib/approval-queue-evidence-copy";
import { filterWhereToGoNextFollowUpLinks } from "@/lib/evidence-orientation/where-to-go-next-follow-up-links";
import { formatHelpFollowUpLinkAccessibleName } from "@/lib/help/help-follow-up-link-label";

describe("ApprovalQueueClaimOrientationStrip", () => {
  it("lists follow-up Sources without duplicating header claim discipline", () => {
    render(<ApprovalQueueClaimOrientationStrip />);

    const sourcesSection = screen.getByTestId("approval-queue-sources");

    expect(sourcesSection).toBeInTheDocument();
    expect(screen.queryByTestId("approval-queue-claim-discipline")).not.toBeInTheDocument();

    for (const link of filterWhereToGoNextFollowUpLinks(APPROVAL_QUEUE_SOURCES)) {
      const accessibleName = formatHelpFollowUpLinkAccessibleName(link.href, link.label);
      expect(within(sourcesSection).getByRole("link", { name: accessibleName })).toHaveAttribute("href", link.href);
    }
  });
});
