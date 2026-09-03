import { describe, expect, it } from "vitest";

import type { NavGroupWithVisibleLinks } from "@/lib/nav-shell-visibility";
import { filterNavGroupsForWorkingProfessionalMode } from "@/lib/workspace-mode/working-mode-nav-filter";

const sampleRows: NavGroupWithVisibleLinks[] = [
  {
    id: "outcomes",
    label: "Outcomes",
    visibleLinks: [
      { href: "/value-report/pilot", label: "Pilot value" },
      { href: "/insights/architecture-scorecard", label: "Scorecard" },
      { href: "/value-report/roi", label: "ROI" },
    ],
  },
  {
    id: "governance",
    label: "Governance",
    visibleLinks: [
      { href: "/governance/dashboard", label: "Dashboard" },
      { href: "/governance/needs-attention", label: "Needs attention" },
    ],
  },
];

describe("filterNavGroupsForWorkingProfessionalMode", () => {
  it("removes secondary reporting destinations while keeping canonical hubs", () => {
    const filtered = filterNavGroupsForWorkingProfessionalMode(sampleRows);

    expect(filtered).toHaveLength(1);
    expect(filtered[0]?.visibleLinks.map((link) => link.href)).toEqual([
      "/governance/needs-attention",
    ]);
  });
});
