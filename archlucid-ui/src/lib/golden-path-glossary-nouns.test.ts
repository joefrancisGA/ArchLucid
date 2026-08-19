import { describe, expect, it } from "vitest";

import {
  GOLDEN_PATH_GLOSSARY_BANNED_BODY_FRAGMENTS,
  GOLDEN_PATH_GLOSSARY_NOUN_IDS,
  getGoldenPathGlossaryNoun,
  goldenPathGlossaryHelpHref,
} from "@/lib/golden-path-glossary-nouns";
import { getCustomerGlossaryTermById } from "@/lib/customer-glossary-manifest";

describe("golden-path-glossary-nouns", () => {
  it("resolves all four core nouns from the customer glossary SoT", () => {
    for (const id of GOLDEN_PATH_GLOSSARY_NOUN_IDS) {
      const fromHelper = getGoldenPathGlossaryNoun(id);
      const fromManifest = getCustomerGlossaryTermById(id);

      expect(fromManifest).not.toBeNull();
      expect(fromHelper.definition).toBe(fromManifest!.definition);
      expect(fromHelper.label).toBe(fromManifest!.label);
      expect(goldenPathGlossaryHelpHref(id)).toBe(`/help/glossary#term-${id}`);
    }
  });

  it("keeps chip bodies free of banned eng jargon fragments", () => {
    for (const id of GOLDEN_PATH_GLOSSARY_NOUN_IDS) {
      const body = `${getGoldenPathGlossaryNoun(id).label} ${getGoldenPathGlossaryNoun(id).definition}`.toLowerCase();

      for (const banned of GOLDEN_PATH_GLOSSARY_BANNED_BODY_FRAGMENTS) {
        expect(body, id).not.toContain(banned);
      }
    }
  });
});
