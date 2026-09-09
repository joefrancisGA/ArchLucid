import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { HelpTopicCatchallEvidenceOrientationStrip } from "@/components/help/HelpTopicCatchallEvidenceOrientationStrip";
import { HELP_TOPIC_CATCHALL_SOURCES } from "@/lib/help/help-topic-catchall-evidence-copy";
import { filterWhereToGoNextFollowUpLinks } from "@/lib/evidence-orientation/where-to-go-next-follow-up-links";
import { formatHelpFollowUpLinkAccessibleName } from "@/lib/help/help-follow-up-link-label";

describe("HelpTopicCatchallEvidenceOrientationStrip", () => {
  it("lists follow-up Sources without duplicating header claim discipline", () => {
    render(<HelpTopicCatchallEvidenceOrientationStrip />);

    const sourcesSection = screen.getByTestId("help-topic-catchall-sources");

    expect(sourcesSection).toBeInTheDocument();
    expect(screen.queryByTestId("help-topic-catchall-claim-discipline")).not.toBeInTheDocument();

    for (const link of filterWhereToGoNextFollowUpLinks(HELP_TOPIC_CATCHALL_SOURCES)) {
      const accessibleName = formatHelpFollowUpLinkAccessibleName(link.href, link.label);
      expect(within(sourcesSection).getByRole("link", { name: accessibleName })).toHaveAttribute("href", link.href);
    }
  });
});
