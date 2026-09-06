import { afterEach, describe, expect, it } from "vitest";

import {
  clearArchitectureCreationDraftId,
  readArchitectureCreationDraftId,
  replaceArchitectureCreationUrlWithoutNavigation,
  writeArchitectureCreationDraftId,
} from "@/lib/architecture/architecture-creation-session";
import { architectureIdentityDraftHref } from "@/lib/architecture/architecture-routes";

describe("architecture-creation-session", () => {
  afterEach(() => {
    clearArchitectureCreationDraftId();
    window.history.replaceState({}, "", "/architecture/architectures/new");
  });

  it("updates the address bar to the identity desk after deferred create (CA-24)", () => {
    writeArchitectureCreationDraftId("draft-001");

    replaceArchitectureCreationUrlWithoutNavigation({
      draftId: "draft-001",
      architectureId: "architecture-identity-001",
    });

    expect(window.location.pathname).toBe("/architecture/architectures/architecture-identity-001");
    expect(window.location.search).toBe("?draft=draft-001");
    expect(readArchitectureCreationDraftId()).toBe("draft-001");
    expect(
      architectureIdentityDraftHref("architecture-identity-001", "draft-001"),
    ).toBe("/architecture/architectures/architecture-identity-001?draft=draft-001");
  });
});
