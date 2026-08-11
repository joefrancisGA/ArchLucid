import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { GlossaryHelpEvidenceOrientationStrip } from "@/components/help/GlossaryHelpEvidenceOrientationStrip";
import {
  GLOSSARY_HELP_CLAIM_DISCIPLINE,
  GLOSSARY_HELP_FOLLOW_UP_LINKS,
} from "@/lib/glossary-help-evidence-copy";

describe("GlossaryHelpEvidenceOrientationStrip", () => {
  it("renders claim discipline callout with inline follow-up links", () => {
    render(<GlossaryHelpEvidenceOrientationStrip />);

    expect(screen.getByTestId("glossary-help-claim-discipline")).toHaveTextContent(GLOSSARY_HELP_CLAIM_DISCIPLINE);

    for (const link of GLOSSARY_HELP_FOLLOW_UP_LINKS) {
      expect(screen.getByRole("link", { name: link.label })).toHaveAttribute("href", link.href);
    }
  });
});
