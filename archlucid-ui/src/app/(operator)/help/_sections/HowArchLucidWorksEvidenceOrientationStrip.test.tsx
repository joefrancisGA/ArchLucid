import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { HowArchLucidWorksEvidenceOrientationStrip } from "@/app/(operator)/help/_sections/HowArchLucidWorksEvidenceOrientationStrip";
import {
  HOW_ARCHLUCID_WORKS_CANONICAL_PATH,
  HOW_ARCHLUCID_WORKS_SOURCES,
} from "@/lib/how-archlucid-works-evidence-copy";

describe("HowArchLucidWorksEvidenceOrientationStrip", () => {
  it("lists follow-up Sources without self-linking how-it-works", () => {
    render(<HowArchLucidWorksEvidenceOrientationStrip />);

    expect(screen.getByTestId("how-archlucid-works-sources")).toBeInTheDocument();
    expect(screen.getByTestId("how-archlucid-works-claim-discipline")).toBeInTheDocument();

    for (const link of HOW_ARCHLUCID_WORKS_SOURCES) {
      expect(screen.getByRole("link", { name: link.label })).toHaveAttribute("href", link.href);
    }

    expect(
      HOW_ARCHLUCID_WORKS_SOURCES.some((link) => link.href === HOW_ARCHLUCID_WORKS_CANONICAL_PATH),
    ).toBe(false);
  });
});
