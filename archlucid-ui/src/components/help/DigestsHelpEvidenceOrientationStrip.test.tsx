import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { DigestsHelpEvidenceOrientationStrip } from "@/components/help/DigestsHelpEvidenceOrientationStrip";
import {
  DIGESTS_HELP_CLAIM_DISCIPLINE,
  DIGESTS_HELP_FOLLOW_UPS_TITLE,
  DIGESTS_HELP_SOURCES,
} from "@/lib/digests-help-evidence-copy";
import { HELP_DILIGENCE_ARTIFACT_INDEX_TITLE } from "@/lib/help-diligence-artifact-index";

describe("DigestsHelpEvidenceOrientationStrip", () => {
  it("renders claim discipline and cross-topic follow-up links", () => {
    render(<DigestsHelpEvidenceOrientationStrip />);

    expect(screen.getByTestId("help-digests-orientation")).toBeInTheDocument();
    expect(screen.getByTestId("help-digests-claim-discipline")).toHaveTextContent(DIGESTS_HELP_CLAIM_DISCIPLINE);
    expect(screen.getByRole("heading", { name: DIGESTS_HELP_FOLLOW_UPS_TITLE })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: HELP_DILIGENCE_ARTIFACT_INDEX_TITLE })).toBeNull();
    expect(screen.queryByRole("complementary")).toBeNull();

    for (const source of DIGESTS_HELP_SOURCES) {
      expect(screen.getByRole("link", { name: source.label })).toHaveAttribute("href", source.href);
    }
  });
});
