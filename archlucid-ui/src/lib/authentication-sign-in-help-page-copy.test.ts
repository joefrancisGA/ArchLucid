import { describe, expect, it } from "vitest";

import {
  AUTHENTICATION_SIGN_IN_HELP_BUYER_OVERVIEW,
  AUTHENTICATION_SIGN_IN_HELP_PAGE_LEAD,
  AUTHENTICATION_SIGN_IN_HELP_START_HERE_HELPER,
} from "@/lib/authentication-sign-in-help-page-copy";

describe("authentication-sign-in-help-page-copy", () => {
  it("keeps buyer overview distinct from page lead and start-here helper", () => {
    expect(AUTHENTICATION_SIGN_IN_HELP_BUYER_OVERVIEW).not.toBe(AUTHENTICATION_SIGN_IN_HELP_PAGE_LEAD);
    expect(AUTHENTICATION_SIGN_IN_HELP_BUYER_OVERVIEW).not.toBe(AUTHENTICATION_SIGN_IN_HELP_START_HERE_HELPER);
  });
});
