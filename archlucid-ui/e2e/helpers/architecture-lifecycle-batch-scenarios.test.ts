import { describe, expect, it } from "vitest";

import {
  ARCHITECTURE_LIFECYCLE_BATCH_UNIQUE_SCENARIO_COUNT,
  buildArchitectureLifecycleBatchScenarios,
  toArchitectureRequestBody,
} from "./architecture-lifecycle-batch-scenarios";

describe("architecture-lifecycle-batch-scenarios", () => {
  it("builds at least one unique scenario template", () => {
    expect(ARCHITECTURE_LIFECYCLE_BATCH_UNIQUE_SCENARIO_COUNT).toBeGreaterThan(0);
  });

  it("expands scenarios with cycle suffix when target exceeds unique pool", () => {
    const uniqueCount = ARCHITECTURE_LIFECYCLE_BATCH_UNIQUE_SCENARIO_COUNT;
    const expanded = buildArchitectureLifecycleBatchScenarios(uniqueCount + 2);

    expect(expanded.length).toBe(uniqueCount + 2);
    expect(expanded.some((scenario) => scenario.name.includes("-cycle2"))).toBe(true);
  });

  it("maps scenario to architecture request body with merged constraints", () => {
    const scenario = buildArchitectureLifecycleBatchScenarios(1)[0];
    const body = toArchitectureRequestBody(scenario, "tenant-a");

    expect(body.systemName).toBe(scenario.brief.systemName);
    expect(body.description).toBe(scenario.brief.description);
    expect(body.environment).toBe(scenario.parameters.environment);
    expect(body.cloudProvider).toBe(scenario.parameters.cloudProvider);
    expect(Array.isArray(body.constraints)).toBe(true);
    expect((body.constraints as string[]).length).toBeGreaterThan(0);
    expect(typeof body.requestId).toBe("string");
    expect((body.requestId as string).length).toBeLessThanOrEqual(64);
  });
});
