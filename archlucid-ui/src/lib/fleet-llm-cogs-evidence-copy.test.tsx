import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { expectFollowUpLink } from "@/lib/claim-discipline-test-helpers";

import { FleetLlmCogsEvidenceOrientationStrip } from "@/components/evidence-orientation/registry/claim-and-sources-strips";
import {
  FLEET_LLM_COGS_CANONICAL_PATH,
  FLEET_LLM_COGS_FOLLOW_UPS_TITLE,
  FLEET_LLM_COGS_SOURCES,
  FLEET_LLM_COGS_SOURCES_INTRO,
} from "@/lib/fleet-llm-cogs-evidence-copy";

describe("fleet-llm-cogs-evidence-copy", () => {
  it("publishes its canonical operator path", () => {
    expect(FLEET_LLM_COGS_CANONICAL_PATH).toBe("/internal/fleet-llm-cogs");
  });

  it("renders claim discipline and operator Sources follow-ups", () => {
    render(<FleetLlmCogsEvidenceOrientationStrip />);

    expect(screen.queryByTestId("fleet-llm-cogs-claim-discipline")).not.toBeInTheDocument();
    expect(screen.getByText(FLEET_LLM_COGS_SOURCES_INTRO)).toBeInTheDocument();

    const sources = screen.getByTestId("fleet-llm-cogs-sources");

    for (const link of FLEET_LLM_COGS_SOURCES) {
      expectFollowUpLink(within(sources), link);
    }

    expect(
      within(sources).queryByRole("link", { name: new RegExp(`^${FLEET_LLM_COGS_CANONICAL_PATH}$`, "i") }),
    ).not.toBeInTheDocument();
  });

  it("labels claim discipline and follow-ups for accessibility parity", () => {
    render(<FleetLlmCogsEvidenceOrientationStrip />);
    expect(screen.getByRole("heading", { name: FLEET_LLM_COGS_FOLLOW_UPS_TITLE })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /Sources package/i })).toBeNull();
  });
});
