import { describe, expect, it } from "vitest";

import {
  AUTHENTICATION_SIGN_IN_INBOUND_HELP_HREF,
  AUTHENTICATION_SIGN_IN_INBOUND_HELP_LINK_LABEL,
} from "@/lib/authentication-sign-in-inbound-copy";
import { AUTHENTICATION_SIGN_IN_HELP_PAGE_TITLE } from "@/lib/authentication-sign-in-help-copy";

describe("authentication sign-in inbound copy (TB-1618)", () => {
  it("aligns auth-shell inbound label with specialty help page title", () => {
    expect(AUTHENTICATION_SIGN_IN_INBOUND_HELP_LINK_LABEL).toBe(AUTHENTICATION_SIGN_IN_HELP_PAGE_TITLE);
    expect(AUTHENTICATION_SIGN_IN_INBOUND_HELP_LINK_LABEL).toBe("Authentication and sign-in");
    expect(AUTHENTICATION_SIGN_IN_INBOUND_HELP_LINK_LABEL.toLowerCase()).not.toBe("authentication help");
  });

  it("routes inbound guidance to the authentication-sign-in help slug", () => {
    expect(AUTHENTICATION_SIGN_IN_INBOUND_HELP_HREF).toBe("/help/authentication-sign-in");
  });
});
