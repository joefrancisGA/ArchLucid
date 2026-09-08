import { renderToStaticMarkup } from "react-dom/server";
import { Suspense, isValidElement } from "react";
import { describe, expect, it } from "vitest";

import {
  AUTH_SIGNIN_PAGE_METADATA_DESCRIPTION,
  AUTH_SIGNIN_PAGE_METADATA_TITLE,
} from "@/lib/auth/auth-signin-page-copy";

import SignInPage, { metadata } from "@/app/(operator)/auth/signin/page";

describe("signin page (TB-1313 parity)", () => {
  it("exports branded document metadata", () => {
    expect(metadata.title).toBe(AUTH_SIGNIN_PAGE_METADATA_TITLE);
    expect(metadata.description).toBe(AUTH_SIGNIN_PAGE_METADATA_DESCRIPTION);
  });

  it("renders the sign-in client route module", () => {
    expect(SignInPage).toBeTypeOf("function");
  });
});

describe("signin page (TB-1314 parity)", () => {
  it("wraps the client in Suspense with a branded loading fallback", () => {
    const element = SignInPage();

    expect(isValidElement(element)).toBe(true);
    expect(element.type).toBe(Suspense);

    const fallback = (element.props as { fallback: React.ReactElement }).fallback;
    expect(renderToStaticMarkup(fallback)).toContain('data-testid="auth-signin-loading"');
  });
});
