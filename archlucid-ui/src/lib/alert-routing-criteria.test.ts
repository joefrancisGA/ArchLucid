import { describe, expect, it } from "vitest";

import {
  formatAlertRoutingCriteriaSummary,
  mergeAlertRoutingCriteriaIntoMetadata,
  parseAlertRoutingCriteriaFromMetadata,
  parseTagsInput,
} from "./alert-routing-criteria";

describe("alert-routing-criteria", () => {
  it("round-trips routing criteria in metadataJson", () => {
    const merged = mergeAlertRoutingCriteriaIntoMetadata("{}", {
      severities: ["High"],
      findingTypes: ["Security"],
      tags: ["phi"],
    });

    expect(parseAlertRoutingCriteriaFromMetadata(merged)).toEqual({
      severities: ["High"],
      findingTypes: ["Security"],
      tags: ["phi"],
    });
  });

  it("formats empty criteria summary", () => {
    expect(formatAlertRoutingCriteriaSummary({ severities: [], findingTypes: [], tags: [] })).toContain(
      "minimum severity only",
    );
  });

  it("parses comma-separated tags", () => {
    expect(parseTagsInput("phi, prod\nsecurity")).toEqual(["phi", "prod", "security"]);
  });
});
