import { describe, expect, it } from "vitest";

import { ApiRequestError } from "@/lib/api-request-error";
import {
  ITSM_ATLASSIAN_OAUTH_CALLBACK_FORBIDDEN_SUBSTRINGS,
  ITSM_ATLASSIAN_OAUTH_CALLBACK_GENERIC_FAILURE,
  ITSM_ATLASSIAN_OAUTH_CALLBACK_IDP_DENIED,
  mapItsmAtlassianOAuthCallbackFailure,
  mapItsmAtlassianOAuthIdpError,
} from "@/lib/itsm-atlassian-oauth-callback-error-copy";

describe("itsm-atlassian-oauth-callback-error-copy (TB-1784)", () => {
  it("maps IdP denial to buyer-safe copy", () => {
    expect(mapItsmAtlassianOAuthIdpError("access_denied", null)).toBe(ITSM_ATLASSIAN_OAUTH_CALLBACK_IDP_DENIED);
    expect(mapItsmAtlassianOAuthIdpError("access_denied", "User cancelled the request.")).toBe(
      "User cancelled the request.",
    );
  });

  it("never surfaces raw engine exception text", () => {
    const raw = "ArchLucid.Api.Controllers.ItsmController: SqlException at line 42";

    expect(mapItsmAtlassianOAuthCallbackFailure(new Error(raw))).toBe(
      ITSM_ATLASSIAN_OAUTH_CALLBACK_GENERIC_FAILURE,
    );
  });

  it("maps structured API failures without leaking forbidden substrings", () => {
    const error = new ApiRequestError("Consent exchange failed", {
      problem: {
        title: "Consent exchange failed",
        detail: "The authorization code is invalid or expired.",
        status: 400,
      },
      correlationId: "corr-oauth-1",
      httpStatus: 400,
    });

    const message = mapItsmAtlassianOAuthCallbackFailure(error);

    expect(message).toBe("Consent exchange failed");
    for (const forbidden of ITSM_ATLASSIAN_OAUTH_CALLBACK_FORBIDDEN_SUBSTRINGS) {
      expect(message.toLowerCase()).not.toContain(forbidden.toLowerCase());
    }
  });
});
