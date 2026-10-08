import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { BFF_CSRF_COOKIE_NAME, BFF_CSRF_HEADER } from "@/lib/proxy/bff-session-constants";
import { OPERATOR_SCOPE_STORAGE_KEY } from "@/lib/operator/operator-scope-storage";
import { mergeRegistrationScopeForProxy } from "@/lib/proxy-fetch-registration-scope";

describe("mergeRegistrationScopeForProxy (post-auth bootstrap clients)", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    document.cookie = `${BFF_CSRF_COOKIE_NAME}=; Max-Age=0`;
    localStorage.clear();
  });

  it("does not attach BFF CSRF on HEAD bootstrap polls (same safe-method class as GET)", () => {
    document.cookie = `${BFF_CSRF_COOKIE_NAME}=csrf-token-value`;

    const init = mergeRegistrationScopeForProxy({
      method: "HEAD",
      headers: { Accept: "application/json" },
    });

    const headers = new Headers(init.headers);

    expect(headers.get(BFF_CSRF_HEADER)).toBeNull();
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

  it("attaches operator scope headers on HEAD bootstrap polls when localStorage still has scope", () => {
    localStorage.setItem(
      OPERATOR_SCOPE_STORAGE_KEY,
      JSON.stringify({
        tenantId: "11111111-1111-1111-1111-111111111111",
        workspaceId: "22222222-2222-2222-2222-222222222222",
        projectId: "33333333-3333-3333-3333-333333333333",
        workspaceLabel: "w",
        projectLabel: "p",
      }),
    );

    const init = mergeRegistrationScopeForProxy({
      method: "HEAD",
      headers: { Accept: "application/json" },
    });

    const headers = new Headers(init.headers);

    expect(headers.get("x-tenant-id")).toBe("11111111-1111-1111-1111-111111111111");
    expect(headers.get(BFF_CSRF_HEADER)).toBeNull();
  });
});
