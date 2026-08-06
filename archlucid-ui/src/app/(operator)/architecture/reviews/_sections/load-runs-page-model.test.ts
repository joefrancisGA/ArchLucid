import { describe, expect, it } from "vitest";

import { formatRunsPageProjectTitle } from "./load-runs-page-model";

describe("formatRunsPageProjectTitle", () => {
  it("labels the active project with a clear prefix", () => {
    expect(formatRunsPageProjectTitle("default")).toBe("Project: default");
    expect(formatRunsPageProjectTitle("claims-intake")).toBe("Project: claims-intake");
  });
});
