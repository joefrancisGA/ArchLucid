import { describe, expect, it } from "vitest";

import {
  buildSponsorStoryDispositionCountsFromRows,
  buildSponsorStorySynopsisParagraph,
} from "@/lib/sponsor-story-synopsis";

describe("sponsor-story-synopsis (TB-2183)", () => {
  it("counts disposition buckets from governance queue rows", () => {
    const counts = buildSponsorStoryDispositionCountsFromRows([
      { latestDisposition: "Accepted" },
      { latestDisposition: "Deferred" },
      { latestDisposition: null },
    ]);

    expect(counts.accepted).toBe(1);
    expect(counts.deferred).toBe(1);
    expect(counts.undisposed).toBe(1);
  });

  it("builds honest empty-state synopsis copy", () => {
    const paragraph = buildSponsorStorySynopsisParagraph({
      packageTitle: "Claims intake modernization",
      counts: {
        accepted: 0,
        dismissed: 0,
        deferred: 0,
        needsEvidence: 0,
        remediated: 0,
        undisposed: 3,
      },
    });

    expect(paragraph).toContain("has not started");
    expect(paragraph).toContain("3 findings");
  });

  it("updates synopsis when dispositions are recorded", () => {
    const paragraph = buildSponsorStorySynopsisParagraph({
      packageTitle: "Claims intake modernization",
      counts: {
        accepted: 2,
        dismissed: 0,
        deferred: 1,
        needsEvidence: 0,
        remediated: 0,
        undisposed: 1,
      },
    });

    expect(paragraph).toContain("2 accepted");
    expect(paragraph).toContain("1 deferred");
    expect(paragraph).toContain("1 finding still undisposed");
  });
});
