import { describe, expect, it } from "vitest";

import {
  GLOSSARY_PROCEDURAL_HELP_COMPACT_LINE,
  GLOSSARY_PROCEDURAL_HELP_GLOSSARY_LINK,
  GLOSSARY_PROCEDURAL_HELP_HEADING,
  GLOSSARY_PROCEDURAL_HELP_HELP_HUB_LINK,
  GLOSSARY_PROCEDURAL_HELP_WHY_TWO,
  buildGlossaryProceduralHelpVocabulary,
  resolveGlossaryProceduralHelpPeerLink,
} from "@/lib/vocabulary/glossary-procedural-help-vocabulary";
import { GLOSSARY_HELP_CANONICAL_PATH } from "@/lib/glossary-help-evidence-copy";
import { HELP_HUB_CANONICAL_PATH } from "@/lib/help/help-hub-evidence-copy";

describe("glossary-procedural-help-vocabulary (TB-2308)", () => {
  it("explains term definitions vs how-to help hub", () => {
    const model = buildGlossaryProceduralHelpVocabulary();

    expect(model.heading).toBe(GLOSSARY_PROCEDURAL_HELP_HEADING);
    expect(model.whyTwo).toBe(GLOSSARY_PROCEDURAL_HELP_WHY_TWO);
    expect(model.whyTwo.toLowerCase()).toContain("definition");
    expect(model.whyTwo.toLowerCase()).toContain("runbook");
    expect(model.compactLine).toBe(GLOSSARY_PROCEDURAL_HELP_COMPACT_LINE);

    expect(model.glossaryLink).toEqual(GLOSSARY_PROCEDURAL_HELP_GLOSSARY_LINK);
    expect(model.glossaryLink.href).toBe(GLOSSARY_HELP_CANONICAL_PATH);
    expect(model.helpHubLink).toEqual(GLOSSARY_PROCEDURAL_HELP_HELP_HUB_LINK);
    expect(model.helpHubLink.href).toBe(HELP_HUB_CANONICAL_PATH);
  });

  it("resolves the peer surface from glossary and help-hub", () => {
    expect(resolveGlossaryProceduralHelpPeerLink("glossary")).toEqual(
      GLOSSARY_PROCEDURAL_HELP_HELP_HUB_LINK,
    );

    expect(resolveGlossaryProceduralHelpPeerLink("help-hub")).toEqual(
      GLOSSARY_PROCEDURAL_HELP_GLOSSARY_LINK,
    );
  });
});
