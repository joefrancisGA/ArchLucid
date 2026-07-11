import { describe, expect, it } from "vitest";

import {
  mapTeamsSecretValidationApiOutcome,
  validateTeamsKeyVaultSecretNameClient,
} from "./teams-integration-secret-validation";

describe("validateTeamsKeyVaultSecretNameClient", () => {
  it("rejects webhook URLs in the secret name field", () => {
    const result = validateTeamsKeyVaultSecretNameClient("https://webhook.office.com/secret");

    expect(result.outcome).toBe("invalid-name");
    expect(result.message).toBe("Enter a Key Vault secret name, not a webhook URL.");
  });

  it("accepts a valid secret name", () => {
    const result = validateTeamsKeyVaultSecretNameClient("teams-governance-alerts-prod");

    expect(result.outcome).toBe("valid");
  });
});

describe("mapTeamsSecretValidationApiOutcome", () => {
  it("maps API outcomes to customer-facing messages", () => {
    expect(mapTeamsSecretValidationApiOutcome("Found").message).toBe("Secret found and accessible.");
    expect(mapTeamsSecretValidationApiOutcome("NotFound").message).toBe(
      "We could not find a secret with that name.",
    );
  });
});
