import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  usePathname: (): string => "/governance/approval-queue",
  useRouter: (): { push: () => void; replace: () => void } => ({ push: vi.fn(), replace: vi.fn() }),
  useSearchParams: (): URLSearchParams => new URLSearchParams("approvalQueueSourcesOpen=1"),
}));

vi.mock("@/components/WhereToGoNextPreferenceProvider", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/components/WhereToGoNextPreferenceProvider")>();

  return {
    ...actual,
    useWhereToGoNextVisible: () => true,
  };
});

import { ApprovalQueueClaimOrientationStrip } from "@/app/(operator)/governance/_sections/ApprovalQueueClaimOrientationStrip";
import { APPROVAL_QUEUE_SOURCES } from "@/lib/approval-queue-evidence-copy";
import { filterOrientationSourcesForJobContext } from "@/lib/evidence-orientation/job-context-orientation-sources-filter";
import { filterWhereToGoNextFollowUpLinks } from "@/lib/evidence-orientation/where-to-go-next-follow-up-links";
import { formatHelpFollowUpLinkAccessibleName } from "@/lib/help/help-follow-up-link-label";

describe("ApprovalQueueClaimOrientationStrip", () => {
  it("lists follow-up Sources without duplicating header claim discipline", () => {
    render(<ApprovalQueueClaimOrientationStrip />);

    const sourcesSection = screen.getByTestId("approval-queue-sources");

    expect(sourcesSection).toBeInTheDocument();
    expect(screen.queryByTestId("approval-queue-claim-discipline")).not.toBeInTheDocument();

    const visibleSources = filterOrientationSourcesForJobContext(
      filterWhereToGoNextFollowUpLinks(APPROVAL_QUEUE_SOURCES),
      "/governance/approval-queue",
    );

    for (const link of visibleSources) {
      const accessibleName = formatHelpFollowUpLinkAccessibleName(link.href, link.label);
      expect(within(sourcesSection).getByRole("link", { name: accessibleName })).toHaveAttribute("href", link.href);
    }
  });
});
