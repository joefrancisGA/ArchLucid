import { describe, expect, it } from "vitest";

import {
  WORKING_BIND_TOOL_REQUIRES_ARCHITECTURE_REASON,
  applyWorkingBindToolNavGateToLink,
  shouldGateWorkingBindToolNavLink,
} from "@/lib/apply-working-bind-tool-nav-gate";
import { ASK_REVIEW_QUESTIONS_PATH } from "@/lib/ask-review-questions-route";
import { COMPARE_TWO_REVIEWS_PATH } from "@/lib/compare-two-reviews-route";
import { EVIDENCE_GRAPH_PATH } from "@/lib/evidence-graph-route";
import { ARCHITECTURES_LIST_PATH } from "@/lib/architecture/architecture-routes";
import type { NavLinkItem } from "@/lib/nav-config.types";

function link(href: string): NavLinkItem {
  return {
    href,
    label: href,
    title: href,
    tier: "extended",
  };
}

describe("applyWorkingBindToolNavGate", () => {
  it("AO-40: gates Working bind tools when last-open architecture is missing", () => {
    const input = { workingMode: true, lastOpenArchitectureId: null };

    expect(shouldGateWorkingBindToolNavLink(EVIDENCE_GRAPH_PATH, input)).toBe(true);
    expect(shouldGateWorkingBindToolNavLink(ASK_REVIEW_QUESTIONS_PATH, input)).toBe(true);
    expect(shouldGateWorkingBindToolNavLink(COMPARE_TWO_REVIEWS_PATH, input)).toBe(true);
  });

  it("AO-40: leaves bind tools enabled when last-open architecture is set", () => {
    const input = { workingMode: true, lastOpenArchitectureId: "architecture-identity-001" };

    expect(shouldGateWorkingBindToolNavLink(EVIDENCE_GRAPH_PATH, input)).toBe(false);

    const gated = applyWorkingBindToolNavGateToLink(link(EVIDENCE_GRAPH_PATH), input);

    expect(gated.navLinkDisabled).toBeUndefined();
  });

  it("AO-40: Guided mode does not gate bind tools", () => {
    const input = { workingMode: false, lastOpenArchitectureId: null };

    expect(shouldGateWorkingBindToolNavLink(EVIDENCE_GRAPH_PATH, input)).toBe(false);
  });

  it("AO-40: does not gate non-bind Working destinations", () => {
    const input = { workingMode: true, lastOpenArchitectureId: null };

    expect(shouldGateWorkingBindToolNavLink(ARCHITECTURES_LIST_PATH, input)).toBe(false);
  });

  it("AO-40: marks gated links disabled with visible reason copy", () => {
    const gated = applyWorkingBindToolNavGateToLink(link(EVIDENCE_GRAPH_PATH), {
      workingMode: true,
      lastOpenArchitectureId: null,
    });

    expect(gated.navLinkDisabled).toBe(true);
    expect(gated.navLinkDisabledReason).toBe(WORKING_BIND_TOOL_REQUIRES_ARCHITECTURE_REASON);
    expect(gated.navLinkDisabledTitle).toBe(WORKING_BIND_TOOL_REQUIRES_ARCHITECTURE_REASON);
  });
});
