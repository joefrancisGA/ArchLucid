import { describe, expect, it } from "vitest";

import { filterOrientationSourcesForJobContext } from "@/lib/evidence-orientation/job-context-orientation-sources-filter";
import type { EvidenceOrientationLink } from "@/lib/evidence-surface-copy";

const links: readonly EvidenceOrientationLink[] = [
  { label: "Notifications", href: "/administration/notifications" },
  { label: "Alerts inbox", href: "/governance/alerts" },
  { label: "Alert rules", href: "/governance/alert-rules" },
  { label: "Alerts help", href: "/help/alerts" },
  { label: "How ArchLucid works", href: "/help/getting-started#how-archlucid-works" },
];

describe("filterOrientationSourcesForJobContext", () => {
  it("limits follow-ups to three job-relevant hops", () => {
    const filtered = filterOrientationSourcesForJobContext(links, "/help/notifications");

    expect(filtered).toHaveLength(3);
    expect(filtered.some((link) => link.href.startsWith("/help"))).toBe(true);
    expect(filtered[0]?.href).toBe("/help/alerts");
  });

  it("prioritizes governance destinations on governance routes", () => {
    const filtered = filterOrientationSourcesForJobContext(links, "/governance/alerts");

    expect(filtered[0]?.href).toBe("/governance/alerts");
    expect(filtered.some((link) => link.href === "/help/alerts")).toBe(true);
  });

  it("keeps the full Architecture intelligence Sources index without job-context truncation", () => {
    const architectureIntelligenceSources: readonly EvidenceOrientationLink[] = [
      { label: "Findings", href: "/governance/findings" },
      { label: "Start a review", href: "/architecture/reviews/new" },
      { label: "Architecture reviews", href: "/architecture/reviews" },
      { label: "Evidence trail help", href: "/help/evidence-trail" },
      { label: "Audit", href: "/governance/audit" },
    ];

    const filtered = filterOrientationSourcesForJobContext(
      architectureIntelligenceSources,
      "/architecture/architecture-intelligence",
    );

    expect(filtered).toHaveLength(5);
    expect(filtered.some((link) => link.href === "/help/evidence-trail")).toBe(true);
    expect(filtered.some((link) => link.href === "/governance/audit")).toBe(true);
  });
});
