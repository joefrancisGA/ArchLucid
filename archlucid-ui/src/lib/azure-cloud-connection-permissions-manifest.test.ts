import { describe, expect, it } from "vitest";

import {
  AZURE_CLOUD_CONNECTION_CUSTOM_ROLE_READ_ACTIONS,
  AZURE_CLOUD_CONNECTION_FORBIDDEN_ROLES,
  AZURE_CLOUD_CONNECTION_PERMISSIONS_CONTRACT_VERSION,
  AZURE_CLOUD_CONNECTION_ROLE_ROWS,
  AZURE_CLOUD_CONNECTION_VERIFICATION_BEHAVIOR,
} from "@/lib/azure-cloud-connection-permissions-manifest";

const WRITE_ACTION_SUFFIXES = ["/write", "/delete", "/action"] as const;

describe("azure-cloud-connection-permissions-manifest", () => {
  it("declares a versioned contract", () => {
    expect(AZURE_CLOUD_CONNECTION_PERMISSIONS_CONTRACT_VERSION.length).toBeGreaterThan(0);
  });

  it("lists only read-only built-in roles with explicit requirements", () => {
    expect(AZURE_CLOUD_CONNECTION_ROLE_ROWS.map((row) => row.azureRole)).toEqual([
      "Reader",
      "Cost Management Reader",
    ]);
    expect(AZURE_CLOUD_CONNECTION_ROLE_ROWS.every((row) => row.writeAccess === false)).toBe(true);

    const reader = AZURE_CLOUD_CONNECTION_ROLE_ROWS.find((row) => row.azureRole === "Reader");
    const costReader = AZURE_CLOUD_CONNECTION_ROLE_ROWS.find((row) => row.azureRole === "Cost Management Reader");

    expect(reader?.requirement).toBe("required");
    expect(costReader?.requirement).toBe("conditional");
  });

  it("forbids write-enabled onboarding roles", () => {
    expect(AZURE_CLOUD_CONNECTION_FORBIDDEN_ROLES).toEqual(
      expect.arrayContaining(["Owner", "Contributor", "User Access Administrator", "Global Reader"]),
    );
    expect(
      AZURE_CLOUD_CONNECTION_ROLE_ROWS.some((row) =>
        AZURE_CLOUD_CONNECTION_FORBIDDEN_ROLES.includes(row.azureRole),
      ),
    ).toBe(false);
  });

  it("custom role actions exclude wildcard write or delete permissions", () => {
    for (const row of AZURE_CLOUD_CONNECTION_CUSTOM_ROLE_READ_ACTIONS) {
      expect(row.action).not.toMatch(/\*/);
      expect(row.action).not.toMatch(/\/delete$/i);

      for (const suffix of WRITE_ACTION_SUFFIXES) {
        if (suffix === "/action" && row.action.endsWith("/read")) {
          continue;
        }

        if (suffix === "/action" && row.action.includes("/query/action")) {
          continue;
        }

        if (suffix === "/action" && row.action.includes("policyStates/queryResults/action")) {
          continue;
        }
      }
    }
  });

  it("documents hosted verification limits for cost access", () => {
    expect(AZURE_CLOUD_CONNECTION_VERIFICATION_BEHAVIOR.doesNotVerify).toEqual(
      expect.arrayContaining(["Cost Management Reader assignment (hosted collector does not call cost APIs today)"]),
    );
  });
});
