import { describe, expect, it } from "vitest";

import {
  AWS_CLOUD_CONNECTION_PERMISSION_ROWS,
  formatAwsPermissionRequirementLabel,
} from "@/lib/aws-cloud-connection-permissions-manifest";

describe("aws-cloud-connection-permissions-manifest", () => {
  it("exposes concrete IAM identifiers for Resource Explorer inventory", () => {
    const identifiers = AWS_CLOUD_CONNECTION_PERMISSION_ROWS.map((row) => row.iamIdentifier);

    expect(identifiers).toContain("resource-explorer-2:Search");
    expect(identifiers).toContain("AWSResourceExplorerReadOnlyAccess");
    expect(formatAwsPermissionRequirementLabel("required")).toBe("Required");
    expect(formatAwsPermissionRequirementLabel("conditional")).toBe("Conditional");
  });
});
