import { describe, expect, it } from "vitest";

import {
  LOAD_BEARING_GLOSSARY_BANNED_BODY_FRAGMENTS,
  LOAD_BEARING_GLOSSARY_NOUN_IDS,
  getLoadBearingGlossaryNoun,
  loadBearingGlossaryHelpHref,
} from "@/lib/load-bearing-glossary-nouns";
import { getCustomerGlossaryTermById } from "@/lib/customer-glossary-manifest";

describe("load-bearing-glossary-nouns (TB-2239)", () => {
  it("resolves all load-bearing nouns from the customer glossary SoT", () => {
    for (const id of LOAD_BEARING_GLOSSARY_NOUN_IDS) {
      const fromHelper = getLoadBearingGlossaryNoun(id);
      const fromManifest = getCustomerGlossaryTermById(id);

      expect(fromManifest).not.toBeNull();
      expect(fromHelper.definition).toBe(fromManifest!.definition);
      expect(fromHelper.label).toBe(fromManifest!.label);
      expect(loadBearingGlossaryHelpHref(id)).toBe(`/help/glossary#term-${id}`);
    }
  });

  it("keeps chip bodies free of banned eng jargon fragments", () => {
    for (const id of LOAD_BEARING_GLOSSARY_NOUN_IDS) {
      const body = `${getLoadBearingGlossaryNoun(id).label} ${getLoadBearingGlossaryNoun(id).definition}`.toLowerCase();

      for (const banned of LOAD_BEARING_GLOSSARY_BANNED_BODY_FRAGMENTS) {
        expect(body, id).not.toContain(banned);
      }
    }
  });
});
