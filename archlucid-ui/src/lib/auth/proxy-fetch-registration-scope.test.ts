import { afterEach, describe, expect, it } from "vitest";

import { BFF_CSRF_COOKIE_NAME, BFF_CSRF_HEADER } from "@/lib/proxy/bff-session-constants";
import { mergeRegistrationScopeForProxy } from "@/lib/proxy-fetch-registration-scope";

describe("mergeRegistrationScopeForProxy (post-auth bootstrap clients)", () => {
  afterEach(() => {
    document.cookie = `${BFF_CSRF_COOKIE_NAME}=; Max-Age=0`;
  });

  it("does not attach BFF CSRF on GET bootstrap status reads", () => {
    const init = mergeRegistrationScopeForProxy({
      method: "GET",
      headers: { Accept: "application/json" },
    });

    const headers = new Headers(init.headers);

    expect(headers.get(BFF_CSRF_HEADER)).toBeNull();
  });

  it("attaches BFF CSRF on POST bootstrap mutations when the readable token exists", () => {
    document.cookie = `${BFF_CSRF_COOKIE_NAME}=csrf-token-value`;

    const init = mergeRegistrationScopeForProxy({
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });

    const headers = new Headers(init.headers);

    expect(headers.get(BFF_CSRF_HEADER)).toBe("csrf-token-value");
  });
});
