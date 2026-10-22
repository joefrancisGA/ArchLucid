import { describe, expect, it } from "vitest";

import { buildQuickStartRedirectPath } from "./legacy-quick-start-redirect";

describe("buildQuickStartRedirectPath (TB-1816)", () => {

  it("returns bare /get-started when search is empty", () => {

    expect(buildQuickStartRedirectPath({})).toBe("/get-started");

  });

  it("copies scalar query params", () => {

    expect(buildQuickStartRedirectPath({ source: "email" })).toBe("/get-started?source=email");

  });

  it("appends repeated keys from array values", () => {

    const path = buildQuickStartRedirectPath({ tag: ["a", "b"] });

    expect(path).toContain("/get-started?");

    expect(path).toContain("tag=a");

    expect(path).toContain("tag=b");

  });

});

