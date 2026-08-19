import { afterEach, describe, expect, it } from "vitest";

import {
  clearArchitectureCreationHandoff,
  readArchitectureCreationHandoff,
  recordArchitectureCreationHandoff,
} from "@/lib/architecture/architecture-creation-handoff";

const RUN_ID = "11111111-1111-1111-1111-111111111111";

describe("architecture-creation-handoff", () => {
  afterEach(() => {
    clearArchitectureCreationHandoff(RUN_ID);
  });

  it("records and reads create-architecture snapshot data", () => {
    recordArchitectureCreationHandoff({
      runId: RUN_ID,
      architectureName: "Retail API",
      architectureOverview: "Customer-facing API with private networking and Entra ID.",
      businessOutcome: "Improve checkout resilience.",
      peopleAndSystems: [{ label: "Store associate", kind: "Human" }],
    });

    const snapshot = readArchitectureCreationHandoff(RUN_ID);

    expect(snapshot).not.toBeNull();
    expect(snapshot?.architectureName).toBe("Retail API");
    expect(snapshot?.peopleAndSystems).toHaveLength(1);
  });
});
