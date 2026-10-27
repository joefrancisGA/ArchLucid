import { describe, expect, it } from "vitest";

import {
  ARTIFACT_CREATED_DATE_NOT_READABLE,
  ARTIFACT_CREATED_DATE_STORED_EMPTY,
  ARTIFACT_CREATED_DATE_WAS_NOT_STORED,
  formatArtifactCreatedUtcForDisplay,
} from "@/lib/artifacts/format-artifact-created-utc-display";

describe("format-artifact-created-utc-display (P-14)", () => {
  it("labels omitted and empty artifact dates", () => {
    expect(formatArtifactCreatedUtcForDisplay(null)).toBe(ARTIFACT_CREATED_DATE_WAS_NOT_STORED);
    expect(formatArtifactCreatedUtcForDisplay("")).toBe(ARTIFACT_CREATED_DATE_STORED_EMPTY);
    expect(formatArtifactCreatedUtcForDisplay("not-a-date")).toBe(ARTIFACT_CREATED_DATE_NOT_READABLE);
  });
});
