import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { expectFollowUpLink } from "@/lib/claim-discipline-test-helpers";

import { RagHealthEvidenceOrientationStrip } from "@/components/evidence-orientation/registry/claim-and-sources-strips";
import {
  RAG_HEALTH_CANONICAL_PATH,
  RAG_HEALTH_FOLLOW_UPS_TITLE,
  RAG_HEALTH_SOURCES,
  RAG_HEALTH_SOURCES_INTRO,
} from "@/lib/rag-health-evidence-copy";

describe("rag-health-evidence-copy", () => {
  it("publishes its canonical operator path", () => {
    expect(RAG_HEALTH_CANONICAL_PATH).toBe("/internal/rag-health");
  });

  it("renders claim discipline and operator Sources follow-ups", () => {
    render(<RagHealthEvidenceOrientationStrip />);

    expect(screen.queryByTestId("rag-health-claim-discipline")).not.toBeInTheDocument();
    expect(screen.getByText(RAG_HEALTH_SOURCES_INTRO)).toBeInTheDocument();

    const sources = screen.getByTestId("rag-health-sources");

    for (const link of RAG_HEALTH_SOURCES) {
      expectFollowUpLink(within(sources), link);
    }

    expect(
      within(sources).queryByRole("link", { name: new RegExp(`^${RAG_HEALTH_CANONICAL_PATH}$`, "i") }),
    ).not.toBeInTheDocument();
  });

  it("labels claim discipline and follow-ups for accessibility parity", () => {
    render(<RagHealthEvidenceOrientationStrip />);
    expect(screen.getByRole("heading", { name: RAG_HEALTH_FOLLOW_UPS_TITLE })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /Sources package/i })).toBeNull();
  });
});
