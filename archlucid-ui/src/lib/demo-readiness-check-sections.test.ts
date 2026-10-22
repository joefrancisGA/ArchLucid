import { describe, expect, it } from "vitest";

import type { BuyerCtoDemoReadinessCheck } from "@/lib/buyer/buyer-cto-demo-readiness";
import { groupDemoReadinessChecksBySection } from "@/lib/demo-readiness-check-sections";

const sampleChecks: readonly BuyerCtoDemoReadinessCheck[] = [
  { id: "buyer-shell", label: "Buyer shell", status: "pass", detail: "ok" },
  { id: "api-ready", label: "API", status: "fail", detail: "down" },
  { id: "static-label", label: "Static", status: "warn", detail: "fallback" },
];

describe("groupDemoReadinessChecksBySection", () => {
  it("groups checks into compact internal sections and omits empty sections", () => {
    const grouped = groupDemoReadinessChecksBySection(sampleChecks);

    expect(grouped.map((entry) => entry.section.id)).toEqual(["experience", "platform", "presentation"]);
    expect(grouped[0]?.checks.map((check) => check.id)).toEqual(["buyer-shell"]);
    expect(grouped[1]?.checks.map((check) => check.id)).toEqual(["api-ready"]);
    expect(grouped[2]?.checks.map((check) => check.id)).toEqual(["static-label"]);
  });
});
