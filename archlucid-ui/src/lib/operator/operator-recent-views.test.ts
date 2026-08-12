import { describe, expect, it } from "vitest";

import {
  parseStoredRecentViews,
  recordRecentView,
  recentViewLabelFromPathname,
} from "@/lib/operator/operator-recent-views";

describe("operator-recent-views", () => {
  it("records and dedupes recent views", () => {
    const initial = parseStoredRecentViews(null);
    const once = recordRecentView(initial, {
      href: "/architecture/reviews/abc",
      label: "Review",
      kind: "review",
    });
    const twice = recordRecentView(once, {
      href: "/architecture/reviews/abc",
      label: "Review",
      kind: "review",
    });

    expect(twice.entries).toHaveLength(1);
    expect(twice.entries[0]?.href).toBe("/architecture/reviews/abc");
  });

  it("maps pathname labels", () => {
    expect(recentViewLabelFromPathname("/")).toBeNull();
    expect(recentViewLabelFromPathname("/architecture/reviews/run-1")).toBe("Review");
    expect(recentViewLabelFromPathname("/audit")).toBe("Audit trail");
  });
});
