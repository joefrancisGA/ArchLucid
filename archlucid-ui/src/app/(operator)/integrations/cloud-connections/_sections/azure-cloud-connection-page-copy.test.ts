import { describe, expect, it } from "vitest";

import {
  AZURE_CLOUD_CONNECTION_BUYER_OVERVIEW,
  AZURE_CLOUD_CONNECTION_PAGE_LEAD,
  AZURE_CLOUD_CONNECTION_START_HERE_LEAD,
} from "./azure-cloud-connection-page-copy";

describe("azure-cloud-connection-page-copy", () => {
  it("keeps buyer overview distinct from page lead and start-here lead", () => {
    expect(AZURE_CLOUD_CONNECTION_BUYER_OVERVIEW).not.toBe(AZURE_CLOUD_CONNECTION_PAGE_LEAD);
    expect(AZURE_CLOUD_CONNECTION_BUYER_OVERVIEW).not.toBe(AZURE_CLOUD_CONNECTION_START_HERE_LEAD);
  });
});
