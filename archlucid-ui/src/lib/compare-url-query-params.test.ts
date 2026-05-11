import { describe, expect, it } from "vitest";

import {
  comparePageHref,
  readCompareRunIdsFromSearchParams,
} from "@/lib/compare-url-query-params";

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
