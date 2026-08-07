import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { HelpTopicCatchAllEvidenceOrientationStrip } from "@/app/(operator)/help/_sections/HelpTopicCatchAllEvidenceOrientationStrip";
import {
  HELP_TOPIC_CATCHALL_CANONICAL_PATH,
  HELP_TOPIC_CATCHALL_SOURCES,
} from "@/lib/help-topic-catchall-evidence-copy";

describe("HelpTopicCatchAllEvidenceOrientationStrip", () => {
  it("lists follow-up Sources without self-linking the catch-all path pattern", () => {
    render(<HelpTopicCatchAllEvidenceOrientationStrip />);

    expect(screen.getByTestId("help-topic-catchall-sources")).toBeInTheDocument();
    expect(screen.getByTestId("help-topic-catchall-claim-discipline")).toBeInTheDocument();

    for (const link of HELP_TOPIC_CATCHALL_SOURCES) {
      expect(screen.getByRole("link", { name: link.label })).toHaveAttribute("href", link.href);
    }

    expect(
      HELP_TOPIC_CATCHALL_SOURCES.some((link) => link.href === HELP_TOPIC_CATCHALL_CANONICAL_PATH),
    ).toBe(false);
  });
});
