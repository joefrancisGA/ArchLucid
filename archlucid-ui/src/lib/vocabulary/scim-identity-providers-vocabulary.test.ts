import { describe, expect, it } from "vitest";

import {
  SCIM_IDENTITY_PROVIDERS_COMPACT_LINE,
  SCIM_IDENTITY_PROVIDERS_HEADING,
  SCIM_IDENTITY_PROVIDERS_IDP_LINK,
  SCIM_IDENTITY_PROVIDERS_SCIM_LINK,
  SCIM_IDENTITY_PROVIDERS_WHY_TWO,
  buildScimIdentityProvidersVocabulary,
  resolveScimIdentityProvidersPeerLink,
} from "@/lib/vocabulary/scim-identity-providers-vocabulary";
import { SCIM_PROVISIONING_CANONICAL_PATH } from "@/lib/scim-provisioning-evidence-copy";
import { SCIM_IDENTITY_PROVIDERS_HREF } from "@/lib/scim-provisioning-page-copy";

describe("scim-identity-providers-vocabulary (TB-2294)", () => {
  it("explains SCIM directory sync vs identity-provider federation", () => {
    const model = buildScimIdentityProvidersVocabulary();

    expect(model.heading).toBe(SCIM_IDENTITY_PROVIDERS_HEADING);
    expect(model.whyTwo).toBe(SCIM_IDENTITY_PROVIDERS_WHY_TWO);
    expect(model.whyTwo.toLowerCase()).toContain("directory-sync");
    expect(model.whyTwo.toLowerCase()).toContain("federation");
    expect(model.compactLine).toBe(SCIM_IDENTITY_PROVIDERS_COMPACT_LINE);

    expect(model.scimLink).toEqual(SCIM_IDENTITY_PROVIDERS_SCIM_LINK);
    expect(model.scimLink.href).toBe(SCIM_PROVISIONING_CANONICAL_PATH);
    expect(model.identityProvidersLink).toEqual(SCIM_IDENTITY_PROVIDERS_IDP_LINK);
    expect(model.identityProvidersLink.href).toBe(SCIM_IDENTITY_PROVIDERS_HREF);
  });

  it("resolves the peer surface from SCIM and identity providers", () => {
    expect(resolveScimIdentityProvidersPeerLink("scim-provisioning")).toEqual(
      SCIM_IDENTITY_PROVIDERS_IDP_LINK,
    );

    expect(resolveScimIdentityProvidersPeerLink("identity-providers")).toEqual(
      SCIM_IDENTITY_PROVIDERS_SCIM_LINK,
    );
  });
});
