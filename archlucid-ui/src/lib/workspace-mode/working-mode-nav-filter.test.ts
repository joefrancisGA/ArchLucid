import { describe, expect, it } from "vitest";

import type { NavGroupWithVisibleLinks } from "@/lib/nav-shell-visibility";
import { filterNavGroupsForWorkingProfessionalMode } from "@/lib/workspace-mode/working-mode-nav-filter";

const sampleRows: NavGroupWithVisibleLinks[] = [
  {
    id: "analysis",
    label: "Analysis",
    visibleLinks: [
      { href: "/insights/sponsor-report", label: "Outcomes" },
      { href: "/insights/roi-summary", label: "ROI summary" },
      { href: "/insights/architecture-scorecard", label: "Scorecard" },
    ],
  },
];

describe("filterNavGroupsForWorkingProfessionalMode", () => {
  it("removes secondary reporting destinations while keeping canonical hubs", () => {
    const filtered = filterNavGroupsForWorkingProfessionalMode(sampleRows);

    expect(filtered).toHaveLength(1);
    expect(filtered[0]?.visibleLinks.map((link) => link.href)).toEqual(["/insights/sponsor-report"]);
  });
});
