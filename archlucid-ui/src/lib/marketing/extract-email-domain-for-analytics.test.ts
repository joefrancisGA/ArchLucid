import { describe, expect, it } from "vitest";

import { extractEmailDomainForAnalytics } from "./extract-email-domain-for-analytics";

describe("extractEmailDomainForAnalytics", () => {
  it("returns lowercase domain", () => {
    expect(extractEmailDomainForAnalytics("User@Example.COM")).toBe("example.com");
  });

  it("returns undefined for invalid email shapes", () => {
    expect(extractEmailDomainForAnalytics("nope")).toBeUndefined();
    expect(extractEmailDomainForAnalytics("@x.com")).toBeUndefined();
  });
});
