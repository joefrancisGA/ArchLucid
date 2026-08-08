import { describe, expect, it } from "vitest";

import { findPresetCtasTargetingRedirectSources } from "@/lib/empty-state-preset-cta-guard";
import { GOVERNANCE_POLICY_PACKS_PATH } from "@/lib/governance-route-paths";
import { GOVERNANCE_WORKFLOW_IDLE } from "@/lib/empty-state-presets";
import {
  hrefPathname,
  hrefTargetsPermanentRedirectSource,
  NEXT_CONFIG_PERMANENT_REDIRECT_SOURCE_PATHS,
} from "@/lib/next-config-permanent-redirect-source-paths";

describe("empty-state preset CTA guard (IA-012)", () => {
  it("documents permanent redirect sources synced with next.config.ts", () => {
    expect(NEXT_CONFIG_PERMANENT_REDIRECT_SOURCE_PATHS).toEqual([]);
  });

  it("strips query strings when matching redirect sources", () => {
    expect(hrefPathname("/architecture/reviews")).toBe("/architecture/reviews");
    expect(hrefTargetsPermanentRedirectSource("/audit?runId=abc")).toBe(false);
  });

  it("points governance workflow idle policy packs at the canonical path", () => {
    const policyPacksAction = GOVERNANCE_WORKFLOW_IDLE.actions?.find(
      (action) => action.label === "Policy packs",
    );

    expect(policyPacksAction?.href).toBe(GOVERNANCE_POLICY_PACKS_PATH);
  });

  it("keeps empty-state and enterprise-compact preset CTAs off redirect sources", () => {
    const violations = findPresetCtasTargetingRedirectSources();

    expect(violations, JSON.stringify(violations, null, 2)).toEqual([]);
  });
});
