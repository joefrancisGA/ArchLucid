import { describe, expect, it } from "vitest";

import { OPERATOR_NAV_LINK_LABELS } from "@/lib/i18n";
import { resolveNavLinkTooltipTitle } from "@/lib/nav-link-tooltip";

describe("resolveNavLinkTooltipTitle", () => {
  it("strips a leading label prefix separated by an em dash", () => {
    expect(
      resolveNavLinkTooltipTitle(
        "Users & roles",
        "Users & roles — directory and role assignments",
      ),
    ).toBe("directory and role assignments");
  });

  it("strips when the configured label uses i18n constants", () => {
    expect(
      resolveNavLinkTooltipTitle(
        OPERATOR_NAV_LINK_LABELS.knowledgeIndexHealth,
        `${OPERATOR_NAV_LINK_LABELS.knowledgeIndexHealth} — per-corpus index freshness and embedding dimension`,
      ),
    ).toBe("per-corpus index freshness and embedding dimension");
  });

  it("preserves shortcut suffixes after the description", () => {
    expect(
      resolveNavLinkTooltipTitle(
        OPERATOR_NAV_LINK_LABELS.replayReview,
        "Validate review — check stored review output integrity (Alt+P)",
      ),
    ).toBe("check stored review output integrity (Alt+P)");
  });

  it("leaves description-only titles unchanged", () => {
    expect(resolveNavLinkTooltipTitle("Compare two reviews", "See what changed between reviews (Alt+C)")).toBe(
      "See what changed between reviews (Alt+C)",
    );
  });

  it("leaves titles unchanged when the prefix does not match the visible label", () => {
    expect(resolveNavLinkTooltipTitle("Diagnostics dashboard", "System health — API liveness")).toBe(
      "System health — API liveness",
    );
  });
});
