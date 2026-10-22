import { describe, expect, it } from "vitest";

import {
  DIGESTS_HUB_GET_STARTED_TAB_ID,
  digestsHubTabFromSearchParam,
} from "@/lib/digests-hub-tab";

describe("digestsHubTabFromSearchParam", () => {
  it("defaults to get-started for missing, empty, legacy browse, or unknown tab", () => {
    expect(digestsHubTabFromSearchParam(null)).toBe(DIGESTS_HUB_GET_STARTED_TAB_ID);
    expect(digestsHubTabFromSearchParam("")).toBe(DIGESTS_HUB_GET_STARTED_TAB_ID);
    expect(digestsHubTabFromSearchParam("browse")).toBe(DIGESTS_HUB_GET_STARTED_TAB_ID);
    expect(digestsHubTabFromSearchParam("get-started")).toBe(DIGESTS_HUB_GET_STARTED_TAB_ID);
    expect(digestsHubTabFromSearchParam("nope")).toBe(DIGESTS_HUB_GET_STARTED_TAB_ID);
  });

  it("resolves subscriptions and schedule", () => {
    expect(digestsHubTabFromSearchParam("subscriptions")).toBe("subscriptions");
    expect(digestsHubTabFromSearchParam("schedule")).toBe("schedule");
  });
});
