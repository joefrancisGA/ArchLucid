import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import {
  CUSTOMER_AUTH_BANNED_PHRASES,
  CUSTOMER_AUTH_DUAL_METHOD_LEAD,
  CUSTOMER_AUTH_EMAIL_CODE_ACTION,
  CUSTOMER_AUTH_GUIDED_WORKSPACE_SIGN_IN,
  CUSTOMER_AUTH_NON_SSO_ORIENTATION,
  CUSTOMER_AUTH_WORK_SCHOOL_ACTION,
  findCustomerAuthBannedPhrases,
} from "@/lib/auth/customer-auth-messaging";
import { SIGN_IN_PAGE_COPY } from "@/lib/auth/sign-in-page-copy";
import {
  GET_STARTED_GUIDED_WORKSPACE_SIGN_IN_NOTE,
  GET_STARTED_PUBLIC_SAMPLE_SIGN_IN_NOTE,
} from "@/app/(marketing)/get-started/get-started-content";
import { MARKETING_FAQ_ITEMS } from "@/lib/marketing-faq";

const REPO_ROOT = resolve(__dirname, "../../../..");

function readRepoFile(relativePath: string): string {
  return readFileSync(resolve(REPO_ROOT, relativePath), "utf-8");
}

describe("customer-auth-messaging", () => {
  it("ships preferred dual-method and separate action labels", () => {
    expect(CUSTOMER_AUTH_DUAL_METHOD_LEAD).toMatch(/architect plan/i);
    expect(CUSTOMER_AUTH_DUAL_METHOD_LEAD).toMatch(/work account/i);
    expect(CUSTOMER_AUTH_DUAL_METHOD_LEAD).toMatch(/one-time code/i);
    expect(CUSTOMER_AUTH_NON_SSO_ORIENTATION).toMatch(/company sso/i);
    expect(CUSTOMER_AUTH_WORK_SCHOOL_ACTION).toBe("Continue with work or school account");
    expect(CUSTOMER_AUTH_EMAIL_CODE_ACTION).toBe("Continue with email code");
    expect(CUSTOMER_AUTH_GUIDED_WORKSPACE_SIGN_IN).toMatch(/supported identity/i);
    expect(CUSTOMER_AUTH_GUIDED_WORKSPACE_SIGN_IN).toMatch(/one-time code/i);
  });

  it("keeps sign-in page copy aligned with canonical messaging", () => {
    expect(SIGN_IN_PAGE_COPY.optionsLead).toBe(CUSTOMER_AUTH_DUAL_METHOD_LEAD);
    expect(SIGN_IN_PAGE_COPY.optionsOrientation).toBe(CUSTOMER_AUTH_NON_SSO_ORIENTATION);
    expect(SIGN_IN_PAGE_COPY.workSchoolPrimary).toBe(CUSTOMER_AUTH_WORK_SCHOOL_ACTION);
    expect(SIGN_IN_PAGE_COPY.emailCodeSecondary).toBe(CUSTOMER_AUTH_EMAIL_CODE_ACTION);
    expect(SIGN_IN_PAGE_COPY.emailLead.toLowerCase()).not.toContain("create a password");
    expect(SIGN_IN_PAGE_COPY.emailLead).toMatch(/no password is required/i);
    expect(SIGN_IN_PAGE_COPY.emailLead).toMatch(/architect plan/i);
  });

  it("distinguishes public sample language from guided workspace sign-in", () => {
    expect(GET_STARTED_PUBLIC_SAMPLE_SIGN_IN_NOTE).toBe("No sign-in required");
    expect(GET_STARTED_GUIDED_WORKSPACE_SIGN_IN_NOTE).toBe(CUSTOMER_AUTH_GUIDED_WORKSPACE_SIGN_IN);
  });

  it("rejects outdated work-account-only phrases across key customer surfaces", () => {
    const corpus = [
      readRepoFile("archlucid-ui/src/lib/auth/sign-in-page-copy.ts"),
      readRepoFile("archlucid-ui/src/app/(marketing)/get-started/get-started-content.ts"),
      readRepoFile("archlucid-ui/src/app/(marketing)/get-started/GetStartedPageClient.tsx"),
      readRepoFile("docs/BUYER_FIRST_30_MINUTES.md"),
      readRepoFile("docs/library/customer-facing/AUTHENTICATION_AND_SIGN_IN.md"),
      MARKETING_FAQ_ITEMS.map((item) => `${item.question} ${item.answer}`).join(" "),
    ].join("\n");

    const violations = findCustomerAuthBannedPhrases(corpus);

    expect(violations, violations.join(", ")).toEqual([]);
    expect(CUSTOMER_AUTH_BANNED_PHRASES.length).toBeGreaterThan(5);
  });
});
