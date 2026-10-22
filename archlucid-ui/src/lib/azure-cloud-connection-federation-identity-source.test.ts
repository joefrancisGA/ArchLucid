import { describe, expect, it } from "vitest";

import {
  AZURE_FEDERATION_IDENTIFIER_SOURCING_LEAD,
  AZURE_FEDERATION_IDENTIFIER_SOURCING_TAIL,
  AZURE_FEDERATION_SETUP_SCRIPT_UNAVAILABLE_LEAD,
  AZURE_FEDERATION_SETUP_SCRIPT_UNAVAILABLE_TAIL,
} from "@/lib/azure-cloud-connection-federation-identity-source";

describe("azure-cloud-connection-federation-identity-source", () => {
  it("tells operators where to obtain unpublished federation identifiers", () => {
    expect(AZURE_FEDERATION_IDENTIFIER_SOURCING_LEAD).toContain("obtain the current values");
    expect(AZURE_FEDERATION_IDENTIFIER_SOURCING_TAIL).toContain("environment-specific");
    expect(AZURE_FEDERATION_SETUP_SCRIPT_UNAVAILABLE_LEAD).toContain("not pre-filled");
    expect(AZURE_FEDERATION_SETUP_SCRIPT_UNAVAILABLE_TAIL).toContain("infrastructure templates");
  });
});
