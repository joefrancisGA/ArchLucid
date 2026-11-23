import { describe, expect, it } from "vitest";

import { deriveAzureSubscriptionScopeFromConnections } from "./derive-securenow-collection-setup-input";

describe("deriveAzureSubscriptionScopeFromConnections", () => {
  it("counts every listed subscription row, not only the first connection", () => {
    expect(
      deriveAzureSubscriptionScopeFromConnections([
        { subscriptionIds: "sub-a" },
        { subscriptionIds: "sub-b" },
      ]),
    ).toEqual({
      azureSubscriptionIdsPresent: true,
      azureSubscriptionScopeLabel: "sub-a (+1 more)",
    });
  });
});