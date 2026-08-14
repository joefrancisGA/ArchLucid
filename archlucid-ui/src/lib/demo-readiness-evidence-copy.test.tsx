import { readFileSync } from "node:fs";
import path from "node:path";

import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { DemoReadinessEvidenceOrientationStrip } from "@/components/evidence-orientation/registry/claim-and-sources-strips";
import {
  DEMO_READINESS_CANONICAL_PATH,
  DEMO_READINESS_CLAIM_DISCIPLINE,
  DEMO_READINESS_CLAIM_DISCIPLINE_HEADING,
  DEMO_READINESS_CLAIM_HEADING_ID,
  DEMO_READINESS_FOLLOW_UPS_TITLE,
  DEMO_READINESS_SOURCES,
  DEMO_READINESS_SOURCES_INTRO,
} from "@/lib/demo-readiness-evidence-copy";

describe("demo-readiness-evidence-copy", () => {
  it("wires exports into the Demo readiness evidence strip registry", () => {
    const registryPath = path.join(
      process.cwd(),
      "src/components/evidence-orientation/registry/claim-and-sources-strips.tsx",
    );
    const registrySource = readFileSync(registryPath, "utf8");

    expect(registrySource).toContain("demo-readiness-evidence-copy");
    expect(registrySource).toContain("DemoReadinessEvidenceOrientationStrip");
    expect(DEMO_READINESS_CANONICAL_PATH).toBe("/internal/demo-readiness");
  });

  it("renders claim discipline and operator Sources follow-ups", () => {
    render(<DemoReadinessEvidenceOrientationStrip />);

    expect(screen.getByTestId("demo-readiness-claim-discipline")).toHaveTextContent(DEMO_READINESS_CLAIM_DISCIPLINE);
    expect(screen.getByText(DEMO_READINESS_SOURCES_INTRO)).toBeInTheDocument();

    const sources = screen.getByTestId("demo-readiness-sources");

    for (const link of DEMO_READINESS_SOURCES) {
      expect(within(sources).getByRole("link", { name: link.label })).toHaveAttribute("href", link.href);
    }

    expect(
      within(sources).queryByRole("link", { name: new RegExp(`^${DEMO_READINESS_CANONICAL_PATH}$`, "i") }),
    ).not.toBeInTheDocument();
  });

  it("labels claim discipline and follow-ups for accessibility parity", () => {
    render(<DemoReadinessEvidenceOrientationStrip />);

    const claim = screen.getByTestId("demo-readiness-claim-discipline");
    expect(claim).toHaveAttribute("aria-labelledby", DEMO_READINESS_CLAIM_HEADING_ID);
    expect(screen.getByRole("heading", { name: DEMO_READINESS_CLAIM_DISCIPLINE_HEADING })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: DEMO_READINESS_FOLLOW_UPS_TITLE })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /Sources package/i })).toBeNull();
  });
});
