import { describe, expect, it } from "vitest";

import {
  buildStaticCtoDemoRecapPayload,
  formatCtoDemoRecapMarkdown,
} from "@/lib/buyer-cto-demo-recap";

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
  });
});
