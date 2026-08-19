import { afterEach, describe, expect, it } from "vitest";

import { consumePostSignInReturnUrl, storePostSignInReturnUrl } from "@/lib/oidc/session";

describe("storePostSignInReturnUrl / consumePostSignInReturnUrl", () => {
  afterEach(() => {
    sessionStorage.clear();
  });

  it("round-trips a safe local path", () => {
    storePostSignInReturnUrl("/architecture/reviews/123");

    expect(consumePostSignInReturnUrl()).toBe("/architecture/reviews/123");
  });

  it("is single-use — consuming twice returns null the second time", () => {
    storePostSignInReturnUrl("/architecture/reviews/123");
    consumePostSignInReturnUrl();

    expect(consumePostSignInReturnUrl()).toBeNull();
  });

  it("returns null when nothing was ever stored", () => {
    expect(consumePostSignInReturnUrl()).toBeNull();
  });

  it("does not store an absolute external URL", () => {
    storePostSignInReturnUrl("https://evil.example/phish");

    expect(consumePostSignInReturnUrl()).toBeNull();
  });

  it("does not store a protocol-relative URL", () => {
    storePostSignInReturnUrl("//evil.example");

    expect(consumePostSignInReturnUrl()).toBeNull();
  });

  it("does not store a javascript: URL", () => {
    storePostSignInReturnUrl("javascript:alert(1)");

    expect(consumePostSignInReturnUrl()).toBeNull();
  });

  it("does not store a backslash-prefixed URL", () => {
    storePostSignInReturnUrl("/\\evil.example");

    expect(consumePostSignInReturnUrl()).toBeNull();
  });
});
