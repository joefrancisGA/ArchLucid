import { afterEach, describe, expect, it } from "vitest";

import {
  clearLivelihoodDocumentGuardDirtyRegistryForTests,
  hasActiveLivelihoodDocumentGuardDirty,
  registerLivelihoodDocumentGuardDirty,
} from "./livelihood-document-guard-dirty-registry";

describe("livelihood-document-guard-dirty-registry (LW-078)", () => {
  afterEach(() => {
    clearLivelihoodDocumentGuardDirtyRegistryForTests();
  });

  it("tracks active guard registrations", () => {
    expect(hasActiveLivelihoodDocumentGuardDirty()).toBe(false);

    const unregister = registerLivelihoodDocumentGuardDirty();

    expect(hasActiveLivelihoodDocumentGuardDirty()).toBe(true);

    unregister();

    expect(hasActiveLivelihoodDocumentGuardDirty()).toBe(false);
  });
});
