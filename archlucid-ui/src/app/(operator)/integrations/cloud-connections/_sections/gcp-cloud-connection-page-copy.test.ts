import { describe, expect, it } from "vitest";

import {
  GCP_CLOUD_CONNECTION_BUYER_OVERVIEW,
  GCP_CLOUD_CONNECTION_PAGE_LEAD,
  GCP_CLOUD_CONNECTION_START_HERE_LEAD,
} from "./gcp-cloud-connection-page-copy";

describe("gcp-cloud-connection-page-copy", () => {
  it("keeps buyer overview distinct from page lead and start-here lead", () => {
    expect(GCP_CLOUD_CONNECTION_BUYER_OVERVIEW).not.toBe(GCP_CLOUD_CONNECTION_PAGE_LEAD);
    expect(GCP_CLOUD_CONNECTION_BUYER_OVERVIEW).not.toBe(GCP_CLOUD_CONNECTION_START_HERE_LEAD);
  });
});
