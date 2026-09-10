import { describe, expect, it } from "vitest";

import {
  AUTH_INVITE_FIRST_VIEWPORT_ID,
  AUTH_INVITE_PAGE_DESCRIPTION,
  AUTH_INVITE_PAGE_TITLE,
  AUTH_INVITE_PRIMARY_CONTENT_ID,
  AUTH_INVITE_SKIP_TARGET_ID,
} from "@/lib/auth/auth-invite-page-copy";

describe("auth-invite-page-copy (TB-1472)", () => {
  it("uses buyer-facing invitation accept title for document metadata", () => {
    expect(AUTH_INVITE_PAGE_TITLE).toBe("Accept workspace invitation");
    expect(AUTH_INVITE_PAGE_DESCRIPTION.length).toBeGreaterThan(20);
  });

  it("keeps skip target aligned with the first-viewport band", () => {
    expect(AUTH_INVITE_PRIMARY_CONTENT_ID).toBe("auth-invite-primary-content");
    expect(AUTH_INVITE_FIRST_VIEWPORT_ID).toBe("auth-invite-first-viewport");
    expect(AUTH_INVITE_SKIP_TARGET_ID).toBe(AUTH_INVITE_FIRST_VIEWPORT_ID);
  });
});
