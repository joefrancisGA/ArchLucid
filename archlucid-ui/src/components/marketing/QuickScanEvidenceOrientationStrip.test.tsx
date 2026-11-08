import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/components/WhereToGoNextPreferenceProvider", () => ({
  useWhereToGoNextVisible: () => true,
}));

vi.mock("next/navigation", async (importOriginal) => {
  const actual = await importOriginal<typeof import("next/navigation")>();

  return {
    ...actual,
    usePathname: () => "/quick-scan",
    useSearchParams: () => new URLSearchParams(),
    useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn(), prefetch: vi.fn() }),
  };
});

import { QuickScanEvidenceOrientationStrip } from "@/components/marketing/QuickScanEvidenceOrientationStrip";
import {
  expectFollowUpLink,
  whereToGoNextFollowUpLinksForTests,
} from "@/lib/claim-discipline-test-helpers";
import { QUICK_SCAN_CANONICAL_PATH, QUICK_SCAN_SOURCES } from "@/lib/quick-scan-evidence-copy";

describe("QuickScanEvidenceOrientationStrip", () => {
  it("lists follow-up Sources without self-linking quick-scan or an amber claim callout", () => {
    render(<QuickScanEvidenceOrientationStrip />);

    expect(screen.getByTestId("quick-scan-sources")).toBeInTheDocument();
    expect(screen.queryByTestId("quick-scan-claim-discipline")).toBeNull();
    for (const link of whereToGoNextFollowUpLinksForTests(QUICK_SCAN_SOURCES, QUICK_SCAN_CANONICAL_PATH)) {
      expectFollowUpLink(screen, link, { rawLabel: true });
    }
    expect(QUICK_SCAN_SOURCES.some((link) => link.href === QUICK_SCAN_CANONICAL_PATH)).toBe(false);
  });
});
