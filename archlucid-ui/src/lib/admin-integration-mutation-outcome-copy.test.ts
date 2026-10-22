import { describe, expect, it } from "vitest";

import {
  BILLING_CHECKOUT_COMPLETED_SUCCESS_MESSAGE,
  CLOUD_CONNECTION_SAVE_SUCCESS_MESSAGE,
  SAML_CONFIGURATION_SAVED_SUCCESS_MESSAGE,
  SSO_WIZARD_ACTIVATE_SUCCESS_MESSAGE,
} from "./admin-integration-mutation-outcome-copy";
import { WEBHOOKS_SAVE_SUCCESS } from "./webhooks-page-copy";
import { SCIM_TOKEN_CREATED_SUCCESS, SCIM_TOKEN_REVOKED_SUCCESS } from "./scim-provisioning-page-copy";

describe("admin-integration-mutation-outcome-copy", () => {
  it("keeps high-stakes admin/integration acceptance strings stable for durable UI guards", () => {
    expect(CLOUD_CONNECTION_SAVE_SUCCESS_MESSAGE).toContain("connection has been saved");
    expect(SSO_WIZARD_ACTIVATE_SUCCESS_MESSAGE).toContain("configuration saved");
    expect(SSO_WIZARD_ACTIVATE_SUCCESS_MESSAGE.toLowerCase()).toContain("separate platform configuration change");
    expect(SAML_CONFIGURATION_SAVED_SUCCESS_MESSAGE).toContain("SAML configuration saved");
    expect(SCIM_TOKEN_CREATED_SUCCESS).toContain("SCIM token created");
    expect(SCIM_TOKEN_REVOKED_SUCCESS).toContain("revoked");
    expect(WEBHOOKS_SAVE_SUCCESS).toBe("Subscription saved.");
    expect(BILLING_CHECKOUT_COMPLETED_SUCCESS_MESSAGE).toContain("Checkout completed");
  });
});
