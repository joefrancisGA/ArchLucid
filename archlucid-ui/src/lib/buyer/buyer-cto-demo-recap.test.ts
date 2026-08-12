import { describe, expect, it } from "vitest";

import {
  buildStaticCtoDemoRecapPayload,
  formatCtoDemoRecapMarkdown,
  formatCtoDemoHeroStat,
  formatCtoDemoHeroSubStat,
} from "@/lib/buyer/buyer-cto-demo-recap";

describe("buyer-cto-demo-recap", () => {
  it("formats markdown with all recap fields", () => {
    const payload = buildStaticCtoDemoRecapPayload("https://demo.example");
    const markdown = formatCtoDemoRecapMarkdown(payload);

    expect(markdown).toContain(payload.systemName);
    expect(markdown).toContain(String(payload.findingsCount));
    expect(markdown).toContain(payload.riskPosture);
    expect(markdown).toContain("Simulator estimate");
    expect(markdown).toContain(String(payload.firstValueMinutes));
    expect(markdown).toContain(payload.reviewPackageUrl);
    expect(markdown).toContain("Snapshot (read-only, permanent)");
    expect(payload.snapshotUrl).toContain("readOnly=1");
    expect(payload.snapshotUrl).toContain("/architecture/reviews/");
  });

  it("formats hero stat lines", () => {
    const payload = buildStaticCtoDemoRecapPayload("https://demo.example");

    expect(formatCtoDemoHeroStat(payload).startsWith("$")).toBe(true);
    expect(formatCtoDemoHeroSubStat(payload)).toContain(String(payload.firstValueMinutes));
    expect(formatCtoDemoHeroSubStat(payload)).toContain(payload.savingsQualifier);
  });
});
