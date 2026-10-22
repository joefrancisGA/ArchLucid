import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { HelpTopicCatchallEvidenceOrientationStrip } from "@/components/help/HelpTopicCatchallEvidenceOrientationStrip";
import { HELP_TOPIC_CATCHALL_SOURCES } from "@/lib/help/help-topic-catchall-evidence-copy";
import { expectWhereToGoNextFollowUpLinks } from "@/lib/claim-discipline-test-helpers";

describe("HelpTopicCatchallEvidenceOrientationStrip", () => {
  it("lists follow-up Sources without duplicating header claim discipline", () => {
    render(<HelpTopicCatchallEvidenceOrientationStrip />);

    const sourcesSection = screen.getByTestId("help-topic-catchall-sources");

    expect(sourcesSection).toBeInTheDocument();
    expect(screen.queryByTestId("help-topic-catchall-claim-discipline")).not.toBeInTheDocument();

    expectWhereToGoNextFollowUpLinks(within(sourcesSection), HELP_TOPIC_CATCHALL_SOURCES, "/");
  });
});
