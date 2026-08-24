import { describe, expect, it } from "vitest";

import {
  SESSION_EXPIRED_PAGE_METADATA_DESCRIPTION,
  SESSION_EXPIRED_PAGE_METADATA_TITLE,
  SESSION_EXPIRED_SECONDARY_EXIT_LABEL,
  SESSION_EXPIRED_SECONDARY_EXIT_PATH,
  SESSION_EXPIRED_SIGN_IN_ERROR_TITLE,
} from "@/lib/auth/session-expired-page-copy";

describe("session-expired-page-copy (TB-1315)", () => {
  it("routes secondary exit to the operator app home, not marketing welcome", () => {
    expect(SESSION_EXPIRED_SECONDARY_EXIT_PATH).toBe("/");
    expect(SESSION_EXPIRED_SECONDARY_EXIT_PATH).not.toBe("/welcome");
  });

  it("labels secondary exit honestly for signed-out users", () => {
    expect(SESSION_EXPIRED_SECONDARY_EXIT_LABEL).toBe("Back to ArchLucid");
    expect(SESSION_EXPIRED_SECONDARY_EXIT_LABEL.toLowerCase()).not.toContain("return to home");
  });

  it("frames session-expired OIDC failures without access-request wording (TB-1316)", () => {
    expect(SESSION_EXPIRED_SIGN_IN_ERROR_TITLE).toBe("Sign-in could not start");
    expect(SESSION_EXPIRED_SIGN_IN_ERROR_TITLE.toLowerCase()).not.toContain("access request");
  });

  it("TB-1313: exports branded session-expired document metadata", () => {
    expect(SESSION_EXPIRED_PAGE_METADATA_TITLE).toContain("Session expired");
    expect(SESSION_EXPIRED_PAGE_METADATA_TITLE).toContain("ArchLucid");
    expect(SESSION_EXPIRED_PAGE_METADATA_DESCRIPTION.length).toBeGreaterThan(20);
  });
});
