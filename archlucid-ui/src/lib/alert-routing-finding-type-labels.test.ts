import { describe, expect, it } from "vitest";

import {
  labelForAlertRoutingFindingType,
  ALERT_ROUTING_COMMON_FINDING_TYPES,
} from "./alert-routing-finding-type-labels";

describe("alert-routing-finding-type-labels", () => {
  it("maps internal finding types to readable labels", () => {
    expect(labelForAlertRoutingFindingType("TopologyGap")).toBe("Architecture structure gap");
    expect(labelForAlertRoutingFindingType("CompositeAlert")).toBe("Combined alert");
  });

  it("lists common categories before advanced categories", () => {
    expect(ALERT_ROUTING_COMMON_FINDING_TYPES.map((entry) => entry.value)).toEqual([
      "Advisory",
      "Compliance",
      "Security",
      "Cost",
      "Recommendation",
      "Learning",
    ]);
  });
});
