import { describe, expect, it } from "vitest";

import {
  GCP_CLOUD_CONNECTION_PERMISSION_ROWS,
  formatGcpPermissionRequirementLabel,
} from "@/lib/gcp-cloud-connection-permissions-manifest";

describe("gcp-cloud-connection-permissions-manifest", () => {
  it("declares Cloud Asset Viewer and Workload Identity User as required read-only access", () => {
    const cloudAssetViewer = GCP_CLOUD_CONNECTION_PERMISSION_ROWS.find(
      (row) => row.gcpRole === "roles/cloudasset.viewer",
    );
    const workloadIdentityUser = GCP_CLOUD_CONNECTION_PERMISSION_ROWS.find(
      (row) => row.gcpRole === "roles/iam.workloadIdentityUser",
    );

    expect(cloudAssetViewer).toBeDefined();
    expect(cloudAssetViewer?.displayName).toBe("Cloud Asset Viewer");
    expect(formatGcpPermissionRequirementLabel(cloudAssetViewer!.requirement)).toBe("Required");
    expect(cloudAssetViewer?.writeAccess).toBe(false);

    expect(workloadIdentityUser).toBeDefined();
    expect(workloadIdentityUser?.displayName).toBe("Workload Identity User");
    expect(formatGcpPermissionRequirementLabel(workloadIdentityUser!.requirement)).toBe("Required");
    expect(workloadIdentityUser?.writeAccess).toBe(false);
  });
});
