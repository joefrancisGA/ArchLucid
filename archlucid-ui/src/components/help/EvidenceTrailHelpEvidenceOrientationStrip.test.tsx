import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { EvidenceTrailHelpEvidenceOrientationStrip } from "@/components/help/EvidenceTrailHelpEvidenceOrientationStrip";

describe("EvidenceTrailHelpEvidenceOrientationStrip", () => {
  it("suppresses claim-discipline callout because help-evidence-trail is omitted (legacy strip id alias)", () => {
    render(<EvidenceTrailHelpEvidenceOrientationStrip />);

    expect(screen.queryByTestId("evidence-trail-help-claim-discipline")).not.toBeInTheDocument();
    expect(screen.queryByTestId("evidence-trail-help-sources")).toBeNull();
  });
});
