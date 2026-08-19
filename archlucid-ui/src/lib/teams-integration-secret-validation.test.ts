import { describe, expect, it } from "vitest";

import {
  mapTeamsSecretValidationApiOutcome,
  validateTeamsKeyVaultSecretNameClient,
} from "./teams-integration-secret-validation";
import {
  TEAMS_INTEGRATION_SECRET_NAME_NOT_URL_MESSAGE,
  TEAMS_INTEGRATION_SECRET_ACCESS_FAILURE_MESSAGE,
} from "./teams-integration-page-copy";

describe("validateTeamsKeyVaultSecretNameClient", () => {
  it("rejects webhook URLs in the secret name field", () => {
    const result = validateTeamsKeyVaultSecretNameClient("https://webhook.office.com/secret");

    expect(result.outcome).toBe("invalid-name");
    expect(result.message).toBe(TEAMS_INTEGRATION_SECRET_NAME_NOT_URL_MESSAGE);
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
    expect(mapTeamsSecretValidationApiOutcome("PermissionDenied").message).toBe(
      TEAMS_INTEGRATION_SECRET_ACCESS_FAILURE_MESSAGE,
    );
  });
});
