import { describe, expect, it } from "vitest";

import { formatCloudConnectionsReturnLinkLabel } from "@/lib/integrations/cloud-connections-return-path-honesty-copy";

describe("formatCloudConnectionsReturnLinkLabel", () => {
  it("names common SecureNow return paths", () => {
    expect(formatCloudConnectionsReturnLinkLabel("/governance/findings?queue=open")).toContain("findings");
    expect(formatCloudConnectionsReturnLinkLabel("/administration/securenow-sponsor-path")).toContain("sponsor");
    expect(formatCloudConnectionsReturnLinkLabel("/administration/securenow-pilot-decision")).toContain("pilot");
    expect(formatCloudConnectionsReturnLinkLabel("/administration/securenow-investigation-effort")).toContain(
      "investigation",
    );
    expect(formatCloudConnectionsReturnLinkLabel("/administration/extract-upload")).toContain("extract");
  });
});