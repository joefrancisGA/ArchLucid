import { describe, expect, it } from "vitest";

import {
  ARCHITECTURE_OBJECT_MAP_DRAFT_LABEL,
  ARCHITECTURE_OBJECT_MAP_REVIEW_LABEL,
  ARCHITECTURE_OBJECT_MAP_SEALED_LABEL,
  formatArchitectureObjectMapSentence,
} from "@/lib/vocabulary/architecture-object-map";

describe("architecture-object-map (TB-2354)", () => {
  it("names all three objects from each hub focus", () => {
    const draft = formatArchitectureObjectMapSentence("draft");
    const review = formatArchitectureObjectMapSentence("review");
    const sealed = formatArchitectureObjectMapSentence("sealed");

    expect(draft).toContain(ARCHITECTURE_OBJECT_MAP_DRAFT_LABEL.toLowerCase());
    expect(draft).toContain(ARCHITECTURE_OBJECT_MAP_REVIEW_LABEL.toLowerCase());
    expect(draft).toContain(ARCHITECTURE_OBJECT_MAP_SEALED_LABEL.toLowerCase());

    expect(review).toContain(ARCHITECTURE_OBJECT_MAP_DRAFT_LABEL.toLowerCase());
    expect(review).toContain(ARCHITECTURE_OBJECT_MAP_SEALED_LABEL.toLowerCase());

    expect(sealed).toContain(ARCHITECTURE_OBJECT_MAP_REVIEW_LABEL.toLowerCase());
    expect(sealed).toContain(ARCHITECTURE_OBJECT_MAP_DRAFT_LABEL.toLowerCase());
  });
});
