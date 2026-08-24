import { afterEach, describe, expect, it } from "vitest";

import {
  clearArchitectureCreationDraftId,
  readArchitectureCreationDraftId,
  replaceArchitectureCreationUrlWithoutNavigation,
  writeArchitectureCreationDraftId,
} from "@/lib/architecture/architecture-creation-session";

describe("architecture-creation-session", () => {
  afterEach(() => {
    clearArchitectureCreationDraftId();
    window.history.replaceState({}, "", "/architecture/architectures/new");
  });

  it("updates the address bar without a navigation event after deferred create", () => {
    writeArchitectureCreationDraftId("draft-001");

    replaceArchitectureCreationUrlWithoutNavigation("draft-001");

    expect(window.location.pathname).toBe("/architecture/architectures/draft-001");
    expect(readArchitectureCreationDraftId()).toBe("draft-001");
  });
});
