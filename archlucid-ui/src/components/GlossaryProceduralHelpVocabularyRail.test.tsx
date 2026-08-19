import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { GlossaryProceduralHelpVocabularyRail } from "@/components/GlossaryProceduralHelpVocabularyRail";
import {
  GLOSSARY_PROCEDURAL_HELP_COMPACT_LINE,
  GLOSSARY_PROCEDURAL_HELP_GLOSSARY_LINK,
  GLOSSARY_PROCEDURAL_HELP_HEADING,
  GLOSSARY_PROCEDURAL_HELP_HELP_HUB_LINK,
  GLOSSARY_PROCEDURAL_HELP_WHY_TWO,
} from "@/lib/vocabulary/glossary-procedural-help-vocabulary";

describe("GlossaryProceduralHelpVocabularyRail (TB-2308)", () => {
  it("renders glossary strip with peer link to help hub", () => {
    render(<GlossaryProceduralHelpVocabularyRail currentSurfaceId="glossary" />);

    const strip = screen.getByTestId("glossary-procedural-help-vocabulary");
    expect(strip).toHaveAttribute("data-current-surface", "glossary");
    expect(strip.textContent ?? "").toContain(GLOSSARY_PROCEDURAL_HELP_COMPACT_LINE);

    const peer = screen.getByTestId("glossary-procedural-help-vocabulary-peer-link");
    expect(peer).toHaveTextContent(GLOSSARY_PROCEDURAL_HELP_HELP_HUB_LINK.label);
    expect(peer).toHaveAttribute("href", GLOSSARY_PROCEDURAL_HELP_HELP_HUB_LINK.href);
  });

  it("renders help-hub strip with peer link to glossary", () => {
    render(<GlossaryProceduralHelpVocabularyRail currentSurfaceId="help-hub" />);

    const peer = screen.getByTestId("glossary-procedural-help-vocabulary-peer-link");
    expect(peer).toHaveTextContent(GLOSSARY_PROCEDURAL_HELP_GLOSSARY_LINK.label);
    expect(peer).toHaveAttribute("href", GLOSSARY_PROCEDURAL_HELP_GLOSSARY_LINK.href);
  });

  it("renders full variant with why-two explanation", () => {
    render(
      <GlossaryProceduralHelpVocabularyRail currentSurfaceId="glossary" variant="full" />,
    );

    expect(screen.getByText(GLOSSARY_PROCEDURAL_HELP_HEADING)).toBeInTheDocument();
    expect(screen.getByText(GLOSSARY_PROCEDURAL_HELP_WHY_TWO)).toBeInTheDocument();
  });
});
