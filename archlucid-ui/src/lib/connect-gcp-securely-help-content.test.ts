import { describe, expect, it } from "vitest";

import {
  CONNECT_GCP_SECURELY_FEDERATION_INTRO,
  CONNECT_GCP_SECURELY_FEDERATION_SOURCING,
} from "@/lib/connect-gcp-securely-help-content";
import { GCP_CLOUD_CONNECTION_BANNED_COPY } from "@/lib/gcp-cloud-connection-copy";
import { GCP_FEDERATION_IDENTIFIER_SOURCING } from "@/lib/gcp-cloud-connection-federation-identity-source";
import { GCP_WIF_STARTER_FEDERATION_INTRO } from "@/lib/gcp-cloud-connection-wif-starter";

describe("connect-gcp-securely-help-content", () => {
  it("shares federation identifier sourcing between help content and WIF starter", () => {
    expect(CONNECT_GCP_SECURELY_FEDERATION_SOURCING).toBe(GCP_FEDERATION_IDENTIFIER_SOURCING);
    expect(CONNECT_GCP_SECURELY_FEDERATION_INTRO).toBe(GCP_WIF_STARTER_FEDERATION_INTRO);
    expect(GCP_WIF_STARTER_FEDERATION_INTRO).toContain(GCP_FEDERATION_IDENTIFIER_SOURCING);
  });

  it("keeps guide copy free of Tier/hosted-poll jargon (TB-1774)", () => {
    const surfaces = [
      CONNECT_GCP_SECURELY_FEDERATION_INTRO,
      CONNECT_GCP_SECURELY_FEDERATION_SOURCING,
    ];

    for (const surface of surfaces) {
      for (const banned of GCP_CLOUD_CONNECTION_BANNED_COPY) {
        expect(surface.toLowerCase()).not.toContain(banned.toLowerCase());
      }
    }
  });
});
