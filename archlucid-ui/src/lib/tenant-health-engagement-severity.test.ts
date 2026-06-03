import { describe, expect, it } from "vitest";

import { engagementScoreSeverityKind } from "@/lib/tenant-health-engagement-severity";

describe("engagementScoreSeverityKind", () => {
  it("maps low engagement to Critical", () => {
    expect(engagementScoreSeverityKind(10)).toBe("Critical");
  });

  it("maps mid engagement to Medium", () => {
    expect(engagementScoreSeverityKind(45)).toBe("Medium");
  });

  it("maps high engagement to Low", () => {
    expect(engagementScoreSeverityKind(80)).toBe("Low");
  });
});
