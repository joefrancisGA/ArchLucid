import { describe, expect, it } from "vitest";

import {
  SHOWCASE_SAMPLE_CREATED_REGISTRY,
  showcaseSampleCreatedPackageHref,
} from "@/lib/showcase-sample-created-registry";

describe("showcase-sample-created-registry", () => {
  it("documents the created-package showcase spine", () => {
    expect(SHOWCASE_SAMPLE_CREATED_REGISTRY.packageOrigin).toBe("created");
    expect(SHOWCASE_SAMPLE_CREATED_REGISTRY.runId).toBe("northwind-copilot-rag-platform");
  });

  it("builds review detail href for the created sample", () => {
    expect(showcaseSampleCreatedPackageHref()).toBe("/architecture/reviews/northwind-copilot-rag-platform");
  });
});
