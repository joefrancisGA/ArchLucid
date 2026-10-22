import { describe, expect, it } from "vitest";

import {
  IDENTITY_PROVIDERS_OIDC_ORIENTATION_SOURCES,
  IDENTITY_PROVIDERS_OIDC_SOURCES,
} from "@/lib/identity-providers-oidc-evidence-copy";
import { IDENTITY_PROVIDERS_DIAGNOSTICS_LINK_HREF } from "@/lib/identity-providers-settings-copy";

describe("identity-providers-oidc-evidence-copy", () => {
  it("excludes diagnostics and SSO wizard from orientation Sources when the page surfaces those CTAs", () => {
    expect(
      IDENTITY_PROVIDERS_OIDC_SOURCES.some((source) => source.href === IDENTITY_PROVIDERS_DIAGNOSTICS_LINK_HREF),
    ).toBe(true);
    expect(
      IDENTITY_PROVIDERS_OIDC_ORIENTATION_SOURCES.some(
        (source) => source.href === IDENTITY_PROVIDERS_DIAGNOSTICS_LINK_HREF,
      ),
    ).toBe(false);
    expect(
      IDENTITY_PROVIDERS_OIDC_ORIENTATION_SOURCES.some(
        (source) => source.href === "/administration/identity/sso-wizard",
      ),
    ).toBe(false);
  });
});
