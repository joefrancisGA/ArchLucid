import { describe, expect, it } from "vitest";

import {
  AZURE_PERMISSIONS_PAGE_SUBTITLE,
  AZURE_PERMISSIONS_PAGE_SUBTITLE_BUYER,
  azurePermissionsHelpPageSubtitle,
} from "@/lib/azure-cloud-connection-permissions-copy";

describe("azurePermissionsHelpPageSubtitle", () => {
  it("returns buyer and operator subtitles", () => {
    expect(azurePermissionsHelpPageSubtitle(true)).toBe(AZURE_PERMISSIONS_PAGE_SUBTITLE_BUYER);
    expect(azurePermissionsHelpPageSubtitle(false)).toBe(AZURE_PERMISSIONS_PAGE_SUBTITLE);
    expect(AZURE_PERMISSIONS_PAGE_SUBTITLE_BUYER.length).toBeLessThan(AZURE_PERMISSIONS_PAGE_SUBTITLE.length);
  });
});
