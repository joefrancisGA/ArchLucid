import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { EvidenceTrailHelpEvidenceOrientationStrip } from "@/components/help/EvidenceTrailHelpEvidenceOrientationStrip";
import { EVIDENCE_TRAIL_HELP_CLAIM_DISCIPLINE } from "@/lib/evidence-trail-help-evidence-copy";

describe("EvidenceTrailHelpEvidenceOrientationStrip", () => {
  it("renders claim-discipline callout without diligence Sources list (TB-2092)", () => {
    render(<EvidenceTrailHelpEvidenceOrientationStrip />);

    const claimDiscipline = screen.getByTestId("evidence-trail-help-claim-discipline");

    expect(claimDiscipline).toHaveTextContent(EVIDENCE_TRAIL_HELP_CLAIM_DISCIPLINE);
    expect(claimDiscipline).toHaveTextContent("not a sealed-review diligence Sources package");
    expect(screen.queryByTestId("evidence-trail-help-sources")).toBeNull();
  });
});
