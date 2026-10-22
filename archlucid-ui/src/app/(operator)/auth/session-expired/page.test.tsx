import { renderToStaticMarkup } from "react-dom/server";
import { Suspense, isValidElement } from "react";
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

describe("session-expired page (TB-1314)", () => {
  it("wraps the client in Suspense with a branded loading fallback", () => {
    const element = SessionExpiredPage();

    expect(isValidElement(element)).toBe(true);
    expect(element.type).toBe(Suspense);

    const fallback = (element.props as { fallback: React.ReactElement }).fallback;
    expect(renderToStaticMarkup(fallback)).toContain('data-testid="session-expired-loading"');
  });
});
