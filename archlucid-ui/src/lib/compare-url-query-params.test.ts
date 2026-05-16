import { describe, expect, it } from "vitest";

import {
  comparePageHref,
  compareRunIdsAreSameAfterDemoCanonicalization,
  readCompareRunIdsFromSearchParams,
} from "@/lib/compare-url-query-params";

import { SHOWCASE_STATIC_DEMO_RUN_ID } from "@/lib/showcase-static-demo";

describe("readCompareRunIdsFromSearchParams", () => {
  it("prefers canonical left/right over synonyms", () => {
    const sp = new URLSearchParams(
      "leftRunId=a&priorRunId=b&fromRunId=c&rightRunId=r&laterRunId=d&targetRunId=e",
    );
    expect(readCompareRunIdsFromSearchParams(sp)).toEqual({ prior: "a", later: "r" });
  });

  it("accepts buyer-friendly synonyms when canonical keys are absent", () => {
    const sp = new URLSearchParams("priorRunId=v1&laterRunId=v2");

    expect(readCompareRunIdsFromSearchParams(sp)).toEqual({ prior: "v1", later: "v2" });
  });

  it("accepts baselineRunId alias for prior slot", () => {
    const sp = new URLSearchParams("baselineRunId=base&laterRunId=v2");

    expect(readCompareRunIdsFromSearchParams(sp)).toEqual({ prior: "base", later: "v2" });
  });

  it("accepts targetRunId alias when rightRunId and laterRunId are absent", () => {
    const sp = new URLSearchParams("priorRunId=p&targetRunId=t");

    expect(readCompareRunIdsFromSearchParams(sp)).toEqual({ prior: "p", later: "t" });
  });

  it("treats fromRunId as prior when leftRunId is absent", () => {
    const sp = new URLSearchParams("fromRunId=f&rightRunId=r");

    expect(readCompareRunIdsFromSearchParams(sp)).toEqual({ prior: "f", later: "r" });
  });
});

describe("compareRunIdsAreSameAfterDemoCanonicalization", () => {
  it("is false when either side is empty", () => {
    expect(compareRunIdsAreSameAfterDemoCanonicalization("", "a")).toBe(false);
    expect(compareRunIdsAreSameAfterDemoCanonicalization("a", "")).toBe(false);
    expect(compareRunIdsAreSameAfterDemoCanonicalization("  ", "a")).toBe(false);
  });

  it("is true when ids differ only by known demo alias normalization", () => {
    expect(
      compareRunIdsAreSameAfterDemoCanonicalization("claims-intake-modernization-run", SHOWCASE_STATIC_DEMO_RUN_ID),
    ).toBe(true);
  });

  it("is false when ids are not aliases of one another", () => {
    expect(compareRunIdsAreSameAfterDemoCanonicalization("other-run", SHOWCASE_STATIC_DEMO_RUN_ID)).toBe(false);
  });

  it("is false for two distinct non-empty ids", () => {
    expect(compareRunIdsAreSameAfterDemoCanonicalization("run-a", "run-b")).toBe(false);
  });

  it("treats same literal id as a collision", () => {
    expect(compareRunIdsAreSameAfterDemoCanonicalization(" same-id ", "same-id")).toBe(true);
  });
});

describe("comparePageHref", () => {
  it("friendly mode emits prior/later labels and omits empty later side", () => {
    expect(comparePageHref("  x  ", "", "friendly")).toBe("/compare?priorRunId=x");
    expect(comparePageHref("a", "b", "friendly")).toBe("/compare?priorRunId=a&laterRunId=b");
  });

  it("technical mode emits left/right and omits empty later side", () => {
    expect(comparePageHref("x", "", "technical")).toBe("/compare?leftRunId=x");
    expect(comparePageHref("a", "b", "technical")).toBe("/compare?leftRunId=a&rightRunId=b");
  });
});
