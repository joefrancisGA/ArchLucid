import { describe, expect, it } from "vitest";

import {
  AWS_CLOUD_CONNECTION_BUYER_OVERVIEW,
  AWS_CLOUD_CONNECTION_PAGE_LEAD,
  AWS_CLOUD_CONNECTION_START_HERE_LEAD,
} from "./aws-cloud-connection-page-copy";

describe("aws-cloud-connection-page-copy", () => {
  it("keeps buyer overview distinct from page lead and start-here lead", () => {
    expect(AWS_CLOUD_CONNECTION_BUYER_OVERVIEW).not.toBe(AWS_CLOUD_CONNECTION_PAGE_LEAD);
    expect(AWS_CLOUD_CONNECTION_BUYER_OVERVIEW).not.toBe(AWS_CLOUD_CONNECTION_START_HERE_LEAD);
  });
});
