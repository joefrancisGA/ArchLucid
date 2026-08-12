import { describe, expect, it, vi } from "vitest";

import type { FirstPilotReadinessRow } from "@/lib/first-pilot-readiness-cockpit";
import { applyHomeReadinessRowPresentation } from "@/lib/home-readiness-row-present";

vi.mock("@/lib/buyer/buyer-shell-home-present", () => ({
  isBuyerShellHomePresentation: () => true,
}));

describe("home-readiness-row-present", () => {
  it("applies executive labels and governed CTAs on buyer shell", () => {
    const rows: FirstPilotReadinessRow[] = [
      {
        id: "roi-baselines",
        label: "ROI baseline readiness",
        status: "attention",
        summary: "x",
        href: "/insights/architecture-scorecard",
        cta: "Add ROI baseline",
        group: "evidence",
      },
    ];

    const roi = applyHomeReadinessRowPresentation(rows).find((row) => row.id === "roi-baselines");

    expect(roi?.label).toBe("ROI assumptions");
    expect(roi?.cta).toBe("Add ROI assumptions");
  });
});
