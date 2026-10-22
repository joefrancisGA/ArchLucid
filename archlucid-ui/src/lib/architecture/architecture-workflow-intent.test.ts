import { describe, expect, it } from "vitest";

import {
  CREATE_ARCHITECTURE_INTENT,
  resolveArchitectureWorkflowIntent,
} from "@/lib/architecture/architecture-workflow-intent";

describe("resolveArchitectureWorkflowIntent", () => {
  it("returns create-architecture when the intent query param is set", () => {
    expect(
      resolveArchitectureWorkflowIntent((key) => (key === "intent" ? CREATE_ARCHITECTURE_INTENT : null)),
    ).toBe(CREATE_ARCHITECTURE_INTENT);
  });

  it("returns null when intent is absent", () => {
    expect(resolveArchitectureWorkflowIntent(() => null)).toBeNull();
  });
});
