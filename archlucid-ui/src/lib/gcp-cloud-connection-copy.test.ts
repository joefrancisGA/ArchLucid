import { describe, expect, it } from "vitest";

import {
  formatGcpConnectionCollectionSuccessMessage,
  GCP_CLOUD_CONNECTION_BANNED_COPY,
  GCP_CONNECTION_COLLECTION_FAILED_ERROR,
  GCP_CONNECTION_RECENT_ACTIVITY_INSTRUCTIONS,
  GCP_CONNECTION_VALIDATE_INSTRUCTIONS,
} from "@/lib/gcp-cloud-connection-copy";

describe("gcp-cloud-connection-copy", () => {
  it("keeps operator copy free of Tier/hosted-poll jargon (TB-1774)", () => {
    const surfaces = [
      GCP_CONNECTION_COLLECTION_FAILED_ERROR,
      GCP_CONNECTION_VALIDATE_INSTRUCTIONS,
      GCP_CONNECTION_RECENT_ACTIVITY_INSTRUCTIONS,
      formatGcpConnectionCollectionSuccessMessage(12, "pkg-1"),
    ];

    for (const surface of surfaces) {
      for (const banned of GCP_CLOUD_CONNECTION_BANNED_COPY) {
        expect(surface.toLowerCase()).not.toContain(banned.toLowerCase());
      }
    }
  });
});
