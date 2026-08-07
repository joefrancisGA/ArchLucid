import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AcceleratorChooserHelpEvidenceOrientationStrip } from "@/app/(operator)/help/_sections/AcceleratorChooserHelpEvidenceOrientationStrip";
import {
  ACCELERATOR_CHOOSER_HELP_CANONICAL_PATH,
  ACCELERATOR_CHOOSER_HELP_SOURCES,
} from "@/lib/accelerator-chooser-help-evidence-copy";

describe("AcceleratorChooserHelpEvidenceOrientationStrip", () => {
  it("lists follow-up Sources without self-linking accelerator-chooser help", () => {
    render(<AcceleratorChooserHelpEvidenceOrientationStrip />);

    expect(screen.getByTestId("accelerator-chooser-help-sources")).toBeInTheDocument();
    expect(screen.getByTestId("accelerator-chooser-help-claim-discipline")).toBeInTheDocument();

    for (const link of ACCELERATOR_CHOOSER_HELP_SOURCES) {
      expect(screen.getByRole("link", { name: link.label })).toHaveAttribute("href", link.href);
    }

    expect(
      ACCELERATOR_CHOOSER_HELP_SOURCES.some((link) => link.href === ACCELERATOR_CHOOSER_HELP_CANONICAL_PATH),
    ).toBe(false);
  });
});
