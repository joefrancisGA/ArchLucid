import { describe, expect, it } from "vitest";

import {
  cloudConnectionsHelpPrimaryCta,
  cloudConnectionsHelpProviderScopeRows,
  cloudConnectionsHelpTier1,
  resolveCloudConnectionsHelpSources,
} from "@/lib/cloud-connections-help-guide-content";

describe("cloud connections help guide content SecureNow", () => {
  it("uses Azure-only provider scope and extract-upload primary CTA", () => {
    expect(cloudConnectionsHelpProviderScopeRows("security").map((row) => row.platform)).toEqual(["Azure"]);
    expect(cloudConnectionsHelpPrimaryCta("security").href).toContain("manual-upload");
    expect(cloudConnectionsHelpPrimaryCta("security").label).not.toMatch(/architecture review/i);
    expect(cloudConnectionsHelpTier1("security").useWhen).not.toMatch(/New architecture review/i);
    expect(
      resolveCloudConnectionsHelpSources("security").some((source) => source.href.includes("/architecture/reviews")),
    ).toBe(false);
  });
});
