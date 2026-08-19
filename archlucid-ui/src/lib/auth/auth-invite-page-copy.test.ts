import { describe, expect, it } from "vitest";

import {
  AUTH_INVITE_PAGE_DESCRIPTION,
  AUTH_INVITE_PAGE_TITLE,
} from "@/lib/auth/auth-invite-page-copy";

describe("auth-invite-page-copy (TB-1472)", () => {
  it("uses buyer-facing invitation accept title for document metadata", () => {
    expect(AUTH_INVITE_PAGE_TITLE).toBe("Accept workspace invitation");
    expect(AUTH_INVITE_PAGE_DESCRIPTION.length).toBeGreaterThan(20);
  });
});
