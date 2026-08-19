import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { QuickScanClient } from "@/app/(marketing)/quick-scan/QuickScanClient";
import {
  QUICK_SCAN_LAST_REVIEWED_LABEL,
  QUICK_SCAN_PRIMARY_CONTENT_ID,
} from "@/app/(marketing)/quick-scan/quick-scan-page-content";

vi.mock("@/lib/quick-scan/quick-scan-telemetry", () => ({
  trackQuickScanConversionClick: vi.fn(),
  trackQuickScanSampleViewed: vi.fn(),
}));

describe("QuickScanClient", () => {
  it("renders layout-pass chrome without pristine field errors", () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          enabled: true,
          capacityAvailable: true,
          requireSignIn: false,
          sampleResultAvailable: true,
        }),
      }),
    );

    render(<QuickScanClient />);

    const heroHeading = screen.getByRole("heading", { name: /^Quick scan$/i, level: 1 });

    expect(heroHeading).toBeInTheDocument();
    expect(heroHeading.className).toContain("lg:text-5xl");
    expect(screen.getByTestId("quick-scan-hero")).toBeInTheDocument();
    expect(screen.getByTestId("see-it-deliverable-preview")).toBeInTheDocument();
    expect(screen.queryByTestId("quick-scan-hero-meta")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Skip to quick scan content/i })).toHaveAttribute(
      "href",
      `#${QUICK_SCAN_PRIMARY_CONTENT_ID}`,
    );
    expect(screen.getByTestId("quick-scan-page-meta")).toHaveTextContent(QUICK_SCAN_LAST_REVIEWED_LABEL);
    expect(screen.getByTestId("quick-scan-scope-disclosure")).toBeInTheDocument();
    expect(screen.getByTestId("trust-center-revision-history")).toBeInTheDocument();
    expect(document.getElementById("quick-scan-system-name-error")).toBeNull();

    fireEvent.blur(screen.getByLabelText(/System name/i));

    expect(document.getElementById("quick-scan-system-name-error")).toHaveTextContent("System name is required.");
  });
});
