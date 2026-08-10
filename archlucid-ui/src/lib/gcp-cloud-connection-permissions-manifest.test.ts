import { describe, expect, it } from "vitest";

import {
  GCP_CLOUD_CONNECTION_PERMISSION_ROWS,
  formatGcpPermissionRequirementLabel,
} from "@/lib/gcp-cloud-connection-permissions-manifest";

describe("gcp-cloud-connection-permissions-manifest", () => {
  it("declares Cloud Asset Viewer as required read-only access", () => {
    const cloudAssetViewer = GCP_CLOUD_CONNECTION_PERMISSION_ROWS.find(
      (row) => row.gcpRole === "roles/cloudasset.viewer",
    );

    expect(cloudAssetViewer).toBeDefined();
    expect(cloudAssetViewer?.displayName).toBe("Cloud Asset Viewer");
    expect(formatGcpPermissionRequirementLabel(cloudAssetViewer!.requirement)).toBe("Required");
    expect(cloudAssetViewer?.writeAccess).toBe(false);
  });
});
