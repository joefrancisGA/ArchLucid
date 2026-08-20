import { describe, expect, it } from "vitest";

import type { CreateArchitectureRunRequestPayload } from "@/lib/api/architecture-runs";

import { emptyArchitectureDraftStructuredBrief } from "./architecture-draft-structured-brief";
import { projectStructuredBriefOntoCreateRunPayload } from "./project-structured-brief-onto-create-run-payload";

function basePayload(): CreateArchitectureRunRequestPayload {
  return {
    requestId: "req-1",
    description: "Describe the system with enough detail for review.",
    systemName: "Payments",
    environment: "prod",
    cloudProvider: "Azure",
    constraints: ["Existing constraint"],
    requiredCapabilities: [],
    assumptions: [],
    inlineRequirements: [],
  };
}

describe("projectStructuredBriefOntoCreateRunPayload", () => {
  it("merges confirmed brief fields without duplicating base constraints", () => {
    const brief = emptyArchitectureDraftStructuredBrief();
    const projected = projectStructuredBriefOntoCreateRunPayload(basePayload(), {
      ...brief,
      confirmedConstraints: ["RTO 15 minutes", "Existing constraint"],
      confirmedAssumptions: ["Single-region MVP"],
      confirmedRequiredCapabilities: ["Audit trail export"],
      qualityAttribute: "p99 latency < 200ms",
      failureModeNote: "Queue backlog must not block intake",
      operationalOwner: "Platform SRE",
    });

    expect(projected.constraints).toEqual(["Existing constraint", "RTO 15 minutes"]);
    expect(projected.assumptions).toEqual(["Single-region MVP"]);
    expect(projected.requiredCapabilities).toEqual(["Audit trail export"]);
    expect(projected.inlineRequirements).toEqual([
      "Quality Attribute: p99 latency < 200ms",
      "Failure mode and recovery: Queue backlog must not block intake",
      "Operational Owner: Platform SRE",
    ]);
  });
});
