import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { DigestsHelpEvidenceOrientationStrip } from "@/components/help/DigestsHelpEvidenceOrientationStrip";
import {
  DIGESTS_HELP_CLAIM_DISCIPLINE,
  DIGESTS_HELP_SOURCES,
} from "@/lib/digests-help-evidence-copy";

describe("DigestsHelpEvidenceOrientationStrip", () => {
  it("renders claim discipline and diligence artifact index links", () => {
    render(<DigestsHelpEvidenceOrientationStrip />);

    expect(screen.getByTestId("help-digests-orientation")).toBeInTheDocument();
    expect(screen.getByTestId("help-digests-claim-discipline")).toHaveTextContent(DIGESTS_HELP_CLAIM_DISCIPLINE);

    for (const source of DIGESTS_HELP_SOURCES) {
      expect(screen.getByRole("link", { name: source.label })).toHaveAttribute("href", source.href);
    }
  });
});
