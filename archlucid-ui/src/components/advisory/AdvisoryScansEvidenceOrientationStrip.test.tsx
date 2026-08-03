import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AdvisoryScansEvidenceOrientationStrip } from "@/components/advisory/AdvisoryScansEvidenceOrientationStrip";
import {
  ADVISORY_SCANS_CANONICAL_PATH,
  ADVISORY_SCANS_SOURCES,
} from "@/lib/advisory-scans-evidence-copy";

describe("AdvisoryScansEvidenceOrientationStrip", () => {
  it("lists follow-up Sources without self-linking the default hub path", () => {
    render(<AdvisoryScansEvidenceOrientationStrip />);

    expect(screen.getByTestId("advisory-scans-sources")).toBeInTheDocument();
    expect(screen.getByTestId("advisory-scans-claim-discipline")).toBeInTheDocument();

    for (const link of ADVISORY_SCANS_SOURCES) {
      expect(screen.getByRole("link", { name: link.label })).toHaveAttribute("href", link.href);
    }

    expect(ADVISORY_SCANS_SOURCES.some((link) => link.href === ADVISORY_SCANS_CANONICAL_PATH)).toBe(false);
  });
});
