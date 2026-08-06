import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { WhyArchLucidEvidenceOrientationStrip } from "@/app/(operator)/why-archlucid/_sections/WhyArchLucidEvidenceOrientationStrip";
import {
  WHY_ARCHLUCID_CANONICAL_PATH,
  WHY_ARCHLUCID_SOURCES,
} from "@/lib/why-archlucid-evidence-copy";

describe("WhyArchLucidEvidenceOrientationStrip", () => {
  it("lists follow-up Sources without self-linking why-archlucid", () => {
    render(<WhyArchLucidEvidenceOrientationStrip />);

    expect(screen.getByTestId("why-archlucid-sources")).toBeInTheDocument();
    expect(screen.getByTestId("why-archlucid-claim-discipline")).toBeInTheDocument();

    for (const link of WHY_ARCHLUCID_SOURCES) {
      expect(screen.getByRole("link", { name: link.label })).toHaveAttribute("href", link.href);
    }

    expect(WHY_ARCHLUCID_SOURCES.some((link) => link.href === WHY_ARCHLUCID_CANONICAL_PATH)).toBe(false);
  });
});
