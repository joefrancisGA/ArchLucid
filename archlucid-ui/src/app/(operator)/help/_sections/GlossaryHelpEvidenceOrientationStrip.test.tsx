import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { GlossaryHelpEvidenceOrientationStrip } from "@/app/(operator)/help/_sections/GlossaryHelpEvidenceOrientationStrip";
import {
  GLOSSARY_HELP_CANONICAL_PATH,
  GLOSSARY_HELP_SOURCES,
} from "@/lib/glossary-help-evidence-copy";

describe("GlossaryHelpEvidenceOrientationStrip", () => {
  it("lists follow-up Sources without self-linking glossary help", () => {
    render(<GlossaryHelpEvidenceOrientationStrip />);

    expect(screen.getByTestId("glossary-help-sources")).toBeInTheDocument();
    expect(screen.getByTestId("glossary-help-claim-discipline")).toBeInTheDocument();

    for (const link of GLOSSARY_HELP_SOURCES) {
      expect(screen.getByRole("link", { name: link.label })).toHaveAttribute("href", link.href);
    }

    expect(GLOSSARY_HELP_SOURCES.some((link) => link.href === GLOSSARY_HELP_CANONICAL_PATH)).toBe(false);
  });
});
