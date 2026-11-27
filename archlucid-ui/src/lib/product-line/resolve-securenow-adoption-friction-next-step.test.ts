import { describe, expect, it } from "vitest";

import {
  resolveSecureNowAdoptionFrictionNextStep,
  resolveSecureNowAdoptionFrictionPhase,
} from "@/lib/product-line/resolve-securenow-adoption-friction-next-step";
import { CLOUD_CONNECTIONS_PATH } from "@/lib/integrations-nav-paths";

describe("resolve-securenow-adoption-friction-next-step", () => {
  it("names collection phase when setup is incomplete", () => {
    const collectionInput = {
      hasConfiguredProvider: false,
      azureSubscriptionIdsPresent: false,
      hasSuccessfulPull: false,
    };
    expect(resolveSecureNowAdoptionFrictionPhase({ collectionInput })).toBe("needs-collection");
    const next = resolveSecureNowAdoptionFrictionNextStep({
      phase: "needs-collection",
      collectionInput,
    });
    expect(next.lead).toContain("Reader-scoped");
    expect(next.href).toContain(CLOUD_CONNECTIONS_PATH);
    expect(next.blockerKindLine).toContain("Reader role");
  });

  it("names reader scope when collection setup is complete", () => {
    const collectionInput = {
      hasConfiguredProvider: true,
      azureSubscriptionIdsPresent: true,
      hasSuccessfulPull: true,
    };
    expect(resolveSecureNowAdoptionFrictionPhase({ collectionInput })).toBe("reader-scope");
    const next = resolveSecureNowAdoptionFrictionNextStep({
      phase: "reader-scope",
      collectionInput,
    });
    expect(next.lead).toContain("does not change Azure");
    expect(next.ctaLabel).toBe("Azure connections");
  });
});

