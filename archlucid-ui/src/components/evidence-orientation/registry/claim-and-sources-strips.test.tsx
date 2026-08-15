import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import * as claimAndSourcesStrips from "@/components/evidence-orientation/registry/claim-and-sources-strips";

/**
 * Wiring floor for every strip the registry publishes.
 *
 * The table derives from the barrel's exports rather than a hand-kept list, so a strip added to any
 * family module is covered the moment it is exported — and a strip whose copy module stops supplying
 * follow-up links fails here instead of rendering an empty Sources band.
 *
 * Per-surface copy (exact labels, hrefs, claim bands, published test ids) stays asserted in each
 * `*-evidence-copy.test.tsx`; this file only holds the floor that applies to all of them.
 */
type RegistryStrip = () => React.JSX.Element;

function isStripExport(name: string, value: unknown): value is RegistryStrip {
  return typeof value === "function" && name.endsWith("EvidenceOrientationStrip");
}

const registryStrips: readonly (readonly [string, RegistryStrip])[] = Object.entries(
  claimAndSourcesStrips,
)
  .filter(([name, value]): value is RegistryStrip => isStripExport(name, value))
  .map(([name, Strip]) => [name, Strip] as const);

describe("claim-and-sources strip registry", () => {
  it("publishes strips", () => {
    // Guards the table itself: a barrel typo would otherwise make every case below vacuous.
    expect(registryStrips.length).toBeGreaterThan(0);
  });

  describe.each(registryStrips)("%s", (_name, Strip) => {
    it("renders its copy module's follow-up links", () => {
      render(<Strip />);

      const links = screen.getAllByRole("link");

      expect(links.length).toBeGreaterThan(0);

      for (const link of links) {
        expect(link).toHaveAttribute("href");
        expect(link.getAttribute("href")).not.toBe("");
        // An icon-only or empty follow-up reads as a bare bullet to a screen reader.
        expect(link).toHaveAccessibleName();
      }
    });

    it("labels its Sources band with a heading", () => {
      render(<Strip />);

      const headings = screen.getAllByRole("heading");

      expect(headings.length).toBeGreaterThan(0);

      for (const heading of headings) {
        expect(heading).toHaveAccessibleName();
      }
    });
  });
});
