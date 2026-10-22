import { describe, expect, it } from "vitest";

import { GCP_FEDERATION_IDENTIFIER_SOURCING } from "@/lib/gcp-cloud-connection-federation-identity-source";
import { GCP_WIF_STARTER_FEDERATION_INTRO } from "@/lib/gcp-cloud-connection-wif-starter";

describe("gcp-cloud-connection-federation-identity-source", () => {
  it("publishes one shared sourcing sentence for tenant and managed identity identifiers", () => {
    expect(GCP_WIF_STARTER_FEDERATION_INTRO).toContain(GCP_FEDERATION_IDENTIFIER_SOURCING);
    expect(GCP_FEDERATION_IDENTIFIER_SOURCING).toContain("Assurance status");
    expect(GCP_FEDERATION_IDENTIFIER_SOURCING).toContain("managed identity object ID");
  });
});
