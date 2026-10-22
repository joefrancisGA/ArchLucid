import { describe, expect, it } from "vitest";

import type { EvidenceSourceLink, EvidenceSurfaceCopy } from "@/lib/evidence-surface-copy";
import {
  DIGESTS_HELP_CANONICAL_PATH,
  DIGESTS_HELP_CLAIM_DISCIPLINE,
  DIGESTS_HELP_SOURCES,
} from "@/lib/digests-help-evidence-copy";

describe("evidence-surface-copy", () => {
  it("exports shared link and surface copy shapes", () => {
    const link: EvidenceSourceLink = { label: "Reviews", href: "/architecture/reviews" };
    const surface: EvidenceSurfaceCopy = {
      canonicalPath: DIGESTS_HELP_CANONICAL_PATH,
      claimDiscipline: DIGESTS_HELP_CLAIM_DISCIPLINE,
      sources: [link],
    };

    expect(surface.canonicalPath).toBe("/help/digests");
    expect(DIGESTS_HELP_SOURCES[0]?.href).toContain("/architecture/reviews");
  });
});
