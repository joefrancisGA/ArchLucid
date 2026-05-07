import { afterEach, describe, expect, it, vi } from "vitest";

import type { FindingInspectPayload } from "@/types/finding-inspect";

import {
  findingIdsAlignForInspectRoute,
  loadFindingInspectForRoute,
  normalizeFindingInspectRecommendedActions,
} from "./load-finding-inspect-for-route";

vi.mock("@/lib/api", () => ({
  getFindingInspect: vi.fn(),
}));

vi.mock("@/lib/operator-static-demo", () => ({
  tryStaticDemoFindingInspect: vi.fn(),
}));

import { getFindingInspect } from "@/lib/api";
import { tryStaticDemoFindingInspect } from "@/lib/operator-static-demo";

describe("load-finding-inspect-for-route", () => {
  const getInspect = vi.mocked(getFindingInspect);
  const tryStatic = vi.mocked(tryStaticDemoFindingInspect);

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("replaces mismatched inspect payload with static demo when curated payload exists", async () => {
    getInspect.mockResolvedValue({
      findingId: "wrong-id",
      typedPayload: {},
      decisionRuleId: null,
      decisionRuleName: null,
      evidence: [],
      recommendedActions: [],
      auditRowId: null,
      runId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
      manifestVersion: null,
    });

    tryStatic.mockReturnValue({
      findingId: "phi-minimization-risk",
      typedPayload: { title: "ok" },
      decisionRuleId: "r",
      decisionRuleName: "R",
      evidence: [],
      recommendedActions: ["a"],
      auditRowId: null,
      runId: "claims-intake-modernization",
      manifestVersion: "v",
    });

    const r = await loadFindingInspectForRoute("claims-intake-modernization", "phi-minimization-risk");

    expect(r.failure).toBeNull();
    expect(r.invalidRouteAlignment).toBe(false);
    expect(r.payload?.findingId).toBe("phi-minimization-risk");
    expect(r.payload?.runId).toBe("claims-intake-modernization");
  });

  it("signals invalid alignment when inspect disagrees with URL and no static applies", async () => {
    getInspect.mockResolvedValue({
      findingId: "x",
      typedPayload: {},
      decisionRuleId: null,
      decisionRuleName: null,
      evidence: [],
      recommendedActions: [],
      auditRowId: null,
      runId: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
      manifestVersion: null,
    });

    tryStatic.mockReturnValue(null);

    const r = await loadFindingInspectForRoute(
      "6e8c4a10-2b1f-4c9a-9d3e-10b2a4f0c501",
      "phi-minimization-risk",
    );

    expect(r.payload).toBeNull();
    expect(r.failure).toBeNull();
    expect(r.invalidRouteAlignment).toBe(true);
  });

  it("findingIdsAlignForInspectRoute compares trimmed case-insensitive ids", () => {
    expect(findingIdsAlignForInspectRoute("ABC", "abc")).toBe(true);
    expect(findingIdsAlignForInspectRoute(" a ", "a")).toBe(true);
    expect(findingIdsAlignForInspectRoute("one", "two")).toBe(false);
  });

  it("normalizeFindingInspectRecommendedActions defaults missing recommendations to empty array", () => {
    const malformed: FindingInspectPayload = {
      findingId: "f",
      typedPayload: {},
      decisionRuleId: null,
      decisionRuleName: null,
      evidence: [],
      recommendedActions: undefined as unknown as string[],
      auditRowId: null,
      runId: "r",
      manifestVersion: null,
    };

    const normalized = normalizeFindingInspectRecommendedActions(malformed);

    expect(normalized.recommendedActions).toEqual([]);
  });
});
