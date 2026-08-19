import { describe, expect, it } from "vitest";

import {
  PATH_CHOOSER_HELP_BRANCHES,
  PATH_CHOOSER_HELP_CANONICAL_PATH,
  PATH_CHOOSER_HELP_EVALUATOR_SESSION_STEPS,
  PATH_CHOOSER_HELP_PRIMARY_ACTIONS,
} from "@/lib/path-chooser-help-guide-content";
import {
  PATH_CHOOSER_HELP_CLAIM_DISCIPLINE,
  PATH_CHOOSER_HELP_RELATED_NEXT_STEPS,
} from "@/lib/path-chooser-help-evidence-copy";

describe("path-chooser-help-guide-content", () => {
  it("keeps primary CTAs on review start, security-trust, and first-pilot path", () => {
    expect(PATH_CHOOSER_HELP_PRIMARY_ACTIONS.startReview.href).toBe("/architecture/reviews/new");
    expect(PATH_CHOOSER_HELP_PRIMARY_ACTIONS.securityTrust.href).toBe("/help/security-trust");
    expect(PATH_CHOOSER_HELP_PRIMARY_ACTIONS.firstPilotPath.href).toBe("/help/first-architecture-review");
    expect(PATH_CHOOSER_HELP_PRIMARY_ACTIONS.firstPilotPath.label).toBe("Your first architecture review");
  });

  it("maps five goal branches to in-app primary and fallback hrefs", () => {
    expect(PATH_CHOOSER_HELP_BRANCHES).toHaveLength(5);

    for (const branch of PATH_CHOOSER_HELP_BRANCHES) {
      expect(branch.primary.href.startsWith("/")).toBe(true);
      expect(branch.fallback.href.startsWith("/")).toBe(true);
      expect(branch.primary.href).not.toContain(".md");
      expect(branch.fallback.href).not.toContain(".md");
    }

    const evaluateBranch = PATH_CHOOSER_HELP_BRANCHES.find((branch) => branch.id === "evaluate");

    expect(evaluateBranch?.fallback.href).toBe("/help/first-architecture-review");
    expect(evaluateBranch?.fallback.href).not.toContain("pilot-guide");
  });

  it("defines four evaluator session steps with Start and first-review CTAs (TB-1345)", () => {
    expect(PATH_CHOOSER_HELP_EVALUATOR_SESSION_STEPS).toHaveLength(4);
    expect(PATH_CHOOSER_HELP_EVALUATOR_SESSION_STEPS[1]?.action.href).toBe("/architecture/reviews/new");
    expect(PATH_CHOOSER_HELP_EVALUATOR_SESSION_STEPS[2]?.action.href).toBe("/help/first-architecture-review");
  });

  it("lists related next steps without a self-link to path-chooser (TB-1715)", () => {
    expect(
      PATH_CHOOSER_HELP_RELATED_NEXT_STEPS.some((link) => link.href === PATH_CHOOSER_HELP_CANONICAL_PATH),
    ).toBe(false);
    expect(PATH_CHOOSER_HELP_RELATED_NEXT_STEPS.length).toBeLessThanOrEqual(3);
    expect(PATH_CHOOSER_HELP_RELATED_NEXT_STEPS.some((link) => link.href === "/help/security-trust")).toBe(
      true,
    );
  });

  it("states claim discipline without implying CPA or third-party pen test", () => {
    expect(PATH_CHOOSER_HELP_CLAIM_DISCIPLINE.toLowerCase()).not.toContain("cpa");
    expect(PATH_CHOOSER_HELP_CLAIM_DISCIPLINE.toLowerCase()).not.toMatch(/pen[- ]test/i);
    expect(PATH_CHOOSER_HELP_CLAIM_DISCIPLINE.toLowerCase()).toContain("trust center");
  });
});
