import { describe, expect, it } from "vitest";

import {
  SESSION_EXPIRED_PAGE_METADATA_DESCRIPTION,
  SESSION_EXPIRED_PAGE_METADATA_TITLE,
} from "@/lib/auth/session-expired-page-copy";

import SessionExpiredPage, { metadata } from "@/app/(operator)/auth/session-expired/page";

describe("session-expired page (TB-1313)", () => {
  it("exports branded document metadata", () => {
    expect(metadata.title).toBe(SESSION_EXPIRED_PAGE_METADATA_TITLE);
    expect(metadata.description).toBe(SESSION_EXPIRED_PAGE_METADATA_DESCRIPTION);
  });

  it("renders the session-expired client route module", () => {
    expect(SessionExpiredPage).toBeTypeOf("function");
  });
});
