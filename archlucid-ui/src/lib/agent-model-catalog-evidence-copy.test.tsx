import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AgentModelCatalogEvidenceOrientationStrip } from "@/components/evidence-orientation/registry/claim-and-sources-strips";
import {
  AGENT_MODEL_CATALOG_CANONICAL_PATH,
  AGENT_MODEL_CATALOG_FOLLOW_UPS_TITLE,
  AGENT_MODEL_CATALOG_SOURCES,
  AGENT_MODEL_CATALOG_SOURCES_INTRO,
} from "@/lib/agent-model-catalog-evidence-copy";
import { readClaimAndSourcesRegistrySource } from "@/lib/testing/claim-and-sources-registry-source";

describe("agent-model-catalog-evidence-copy", () => {
  it("wires exports into the agent model catalog evidence strip registry", () => {
    const registrySource = readClaimAndSourcesRegistrySource();

    expect(registrySource).toContain("agent-model-catalog-evidence-copy");
    expect(registrySource).toContain("AgentModelCatalogEvidenceOrientationStrip");
    expect(AGENT_MODEL_CATALOG_CANONICAL_PATH).toBe("/internal/agent-model-catalog");
  });

  it("renders operator Sources follow-ups without a claim-discipline callout", () => {
    render(<AgentModelCatalogEvidenceOrientationStrip />);

    expect(screen.queryByTestId("agent-model-catalog-claim-discipline")).not.toBeInTheDocument();
    expect(screen.getByText(AGENT_MODEL_CATALOG_SOURCES_INTRO)).toBeInTheDocument();

    const sources = screen.getByTestId("agent-model-catalog-sources");

    for (const link of AGENT_MODEL_CATALOG_SOURCES) {
      expect(within(sources).getByRole("link", { name: link.label })).toHaveAttribute("href", link.href);
    }

    expect(
      within(sources).queryByRole("link", { name: new RegExp(`^${AGENT_MODEL_CATALOG_CANONICAL_PATH}$`, "i") }),
    ).not.toBeInTheDocument();
  });

  it("labels follow-ups for accessibility parity", () => {
    render(<AgentModelCatalogEvidenceOrientationStrip />);
    expect(screen.getByRole("heading", { name: AGENT_MODEL_CATALOG_FOLLOW_UPS_TITLE })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /Sources package/i })).toBeNull();
  });
});
