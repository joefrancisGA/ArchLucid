import { describe, expect, it } from "vitest";

import { SECURENOW_POLICY_PACKS_PATH } from "@/lib/governance/governance-route-paths";
import { policyPackDetailSourcesForProductLine } from "@/lib/policy/policy-pack-detail-evidence-copy";

describe("policyPackDetailSourcesForProductLine", () => {
  it("uses compliance policy pack hub for the security product line", () => {
    const sources = policyPackDetailSourcesForProductLine("security");
    const library = sources.find((source) => source.label === "Policy pack library");

    expect(library?.href).toBe(SECURENOW_POLICY_PACKS_PATH);
    expect(sources.some((source) => source.href === "/architecture/reviews")).toBe(false);
  });

  it("keeps architecture reviews for the architecture product line", () => {
    const sources = policyPackDetailSourcesForProductLine("architecture");

    expect(sources.some((source) => source.href === "/architecture/reviews")).toBe(true);
  });
});
