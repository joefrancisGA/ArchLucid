import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { QuickScanEvidenceOrientationStrip } from "@/components/marketing/QuickScanEvidenceOrientationStrip";
import { QUICK_SCAN_CANONICAL_PATH, QUICK_SCAN_SOURCES } from "@/lib/quick-scan-evidence-copy";

describe("QuickScanEvidenceOrientationStrip", () => {
  it("lists follow-up Sources without self-linking quick-scan or an amber claim callout", () => {
    render(<QuickScanEvidenceOrientationStrip />);

    expect(screen.getByTestId("quick-scan-sources")).toBeInTheDocument();
    expect(screen.queryByTestId("quick-scan-claim-discipline")).toBeNull();

    for (const link of QUICK_SCAN_SOURCES) {
      expect(screen.getByRole("link", { name: link.label })).toHaveAttribute("href", link.href);
    }

    expect(QUICK_SCAN_SOURCES.some((link) => link.href === QUICK_SCAN_CANONICAL_PATH)).toBe(false);
  });
});
