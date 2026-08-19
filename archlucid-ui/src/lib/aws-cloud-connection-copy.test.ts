import { describe, expect, it } from "vitest";

import {
  AWS_CLOUD_CONNECTION_BANNED_COPY,
  AWS_CONNECTION_COLLECTION_FAILED_ERROR,
  AWS_CONNECTION_DISCONNECT_FAILED_ERROR,
  AWS_CONNECTION_LOAD_FAILED_ERROR,
  AWS_CONNECTION_RECENT_ACTIVITY_EMPTY_STATE,
  AWS_CONNECTION_SAVE_FAILED_ERROR,
  AWS_CONNECTION_VALIDATE_EMPTY_STATE,
  formatAwsConnectionCollectionSuccessMessage,
} from "@/lib/aws-cloud-connection-copy";

describe("aws-cloud-connection-copy", () => {
  it("keeps operator copy free of Tier/hosted-poll jargon (TB-1763)", () => {
    const surfaces = [
      AWS_CONNECTION_COLLECTION_FAILED_ERROR,
      AWS_CONNECTION_LOAD_FAILED_ERROR,
      AWS_CONNECTION_SAVE_FAILED_ERROR,
      AWS_CONNECTION_DISCONNECT_FAILED_ERROR,
      AWS_CONNECTION_VALIDATE_EMPTY_STATE,
      AWS_CONNECTION_RECENT_ACTIVITY_EMPTY_STATE,
      formatAwsConnectionCollectionSuccessMessage(12, "pkg-1"),
    ];

    for (const surface of surfaces) {
      for (const banned of AWS_CLOUD_CONNECTION_BANNED_COPY) {
        expect(surface.toLowerCase()).not.toContain(banned.toLowerCase());
      }
    }
  });
});
