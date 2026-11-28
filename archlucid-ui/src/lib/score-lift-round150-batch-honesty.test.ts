import { describe, expect, it } from "vitest";

import {
  SECURENOW_ADOPTION_FRICTION_NEEDS_COLLECTION_LEAD,
  SECURENOW_ADOPTION_FRICTION_NOT_CERTIFICATION_LINE,
  SECURENOW_ADOPTION_FRICTION_READER_SCOPE_LEAD,
} from "@/lib/product-line/securenow-adoption-friction-next-step-copy";
import { resolveSecureNowCollectionBlockerKindLine } from "@/lib/product-line/securenow-collection-blocker-kind-copy";

describe("score lift round150 wave H2 honesty", () => {
  it("names Reader scope and denies certification theater", () => {
    expect(SECURENOW_ADOPTION_FRICTION_NEEDS_COLLECTION_LEAD).toContain("Reader-scoped");
    expect(SECURENOW_ADOPTION_FRICTION_READER_SCOPE_LEAD).toContain("does not change Azure");
    expect(SECURENOW_ADOPTION_FRICTION_NOT_CERTIFICATION_LINE).toContain("not a self-service certification");
    expect(resolveSecureNowCollectionBlockerKindLine("provider")).toContain("Reader role");
  });
});
