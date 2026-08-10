import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { GlossaryHelpEvidenceOrientationStrip } from "@/components/help/GlossaryHelpEvidenceOrientationStrip";
import { GLOSSARY_HELP_CLAIM_DISCIPLINE } from "@/lib/glossary-help-evidence-copy";

describe("GlossaryHelpEvidenceOrientationStrip", () => {
  it("renders claim discipline callout", () => {
    render(<GlossaryHelpEvidenceOrientationStrip />);

    expect(screen.getByTestId("glossary-help-claim-discipline")).toHaveTextContent(GLOSSARY_HELP_CLAIM_DISCIPLINE);
  });
});
