import { describe, expect, it } from "vitest";

import {
  ADMIN_DIAGNOSTICS_HELP_ADMIN_RELATED_TOPICS,
  ADMIN_DIAGNOSTICS_HELP_BANNED_PUBLIC_RELATED_HELP_SLUGS,
  ADMIN_DIAGNOSTICS_HELP_BUYER_RELATED_TOPICS,
  listAdminDiagnosticsHelpRelatedTopics,
  relatedTopicsContainBannedPublicHelpSlug,
} from "@/lib/admin-diagnostics-help-related-topics";

describe("admin-diagnostics help related topics (TB-1612)", () => {
  it("caps buyer Related topics to troubleshooting and report-a-problem", () => {
    const topics = listAdminDiagnosticsHelpRelatedTopics(false);

    expect(topics).toEqual([...ADMIN_DIAGNOSTICS_HELP_BUYER_RELATED_TOPICS]);
    expect(topics).toHaveLength(2);
    expect(relatedTopicsContainBannedPublicHelpSlug(topics)).toBe(false);
  });

  it("appends admin-only eng runbooks for admin callers", () => {
    const topics = listAdminDiagnosticsHelpRelatedTopics(true);

    expect(topics).toEqual([
      ...ADMIN_DIAGNOSTICS_HELP_BUYER_RELATED_TOPICS,
      ...ADMIN_DIAGNOSTICS_HELP_ADMIN_RELATED_TOPICS,
    ]);
    expect(topics).toHaveLength(4);
  });

  it("documents banned public eng-runbook slugs for reviewers", () => {
    expect(ADMIN_DIAGNOSTICS_HELP_BANNED_PUBLIC_RELATED_HELP_SLUGS).toContain("engineering-troubleshooting");
    expect(ADMIN_DIAGNOSTICS_HELP_BANNED_PUBLIC_RELATED_HELP_SLUGS).toContain("cli-usage");
  });
});
