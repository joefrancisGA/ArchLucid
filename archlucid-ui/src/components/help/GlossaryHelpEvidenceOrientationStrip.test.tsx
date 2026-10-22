import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { GlossaryHelpEvidenceOrientationStrip } from "@/components/help/GlossaryHelpEvidenceOrientationStrip";

describe("GlossaryHelpEvidenceOrientationStrip", () => {
  it("suppresses claim discipline callout because help-glossary is omitted (legacy strip id alias)", () => {
    render(<GlossaryHelpEvidenceOrientationStrip />);

    expect(screen.queryByTestId("glossary-help-claim-discipline")).not.toBeInTheDocument();
  });
});
