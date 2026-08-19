import { afterEach, describe, expect, it } from "vitest";

import {
  OPERATOR_SCOPE_COOKIE_NAME,
  clearOperatorScopeCookie,
  operatorScopeCookiePayloadFromHeaders,
  parseOperatorScopeCookieValue,
  serializeOperatorScopeCookiePayload,
  writeOperatorScopeCookieFromHeaders,
} from "@/lib/operator/operator-scope-cookie";

describe("operator-scope-cookie", () => {
  afterEach(() => {
    clearOperatorScopeCookie();
  });

  it("roundTripsScopeIdsThroughCookieValue", () => {
    const payload = {
      tenantId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
      workspaceId: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
      projectId: "cccccccc-cccc-cccc-cccc-cccccccccccc",
    };

    const serialized = serializeOperatorScopeCookiePayload(payload);

    expect(parseOperatorScopeCookieValue(serialized)).toEqual(payload);
  });

  it("writeOperatorScopeCookieFromHeaders_setsDocumentCookie", () => {
    writeOperatorScopeCookieFromHeaders({
      "x-tenant-id": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
      "x-workspace-id": "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
      "x-project-id": "cccccccc-cccc-cccc-cccc-cccccccccccc",
    });

    expect(document.cookie).toContain(`${OPERATOR_SCOPE_COOKIE_NAME}=`);
  });

  it("operatorScopeCookiePayloadFromHeaders_rejectsIncompleteHeaders", () => {
    expect(
      operatorScopeCookiePayloadFromHeaders({
        "x-tenant-id": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
        "x-workspace-id": "",
        "x-project-id": "cccccccc-cccc-cccc-cccc-cccccccccccc",
      }),
    ).toBeNull();
  });
});
