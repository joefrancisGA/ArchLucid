import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AdminConfigurationEvidenceOrientationStrip } from "@/components/evidence-orientation/registry/claim-and-sources-strips";
import {
  ADMIN_CONFIGURATION_CANONICAL_PATH,
  ADMIN_CONFIGURATION_FOLLOW_UPS_TITLE,
  ADMIN_CONFIGURATION_SOURCES,
  ADMIN_CONFIGURATION_SOURCES_INTRO,
} from "@/lib/admin-configuration-evidence-copy";
import { readClaimAndSourcesRegistrySource } from "@/lib/testing/claim-and-sources-registry-source";

describe("admin-configuration-evidence-copy", () => {
  it("wires exports into the admin configuration evidence strip registry", () => {
    const registrySource = readClaimAndSourcesRegistrySource();

    expect(registrySource).toContain("admin-configuration-evidence-copy");
    expect(registrySource).toContain("AdminConfigurationEvidenceOrientationStrip");
    expect(ADMIN_CONFIGURATION_CANONICAL_PATH).toBe("/internal/configuration");
  });

  it("renders operator Sources follow-ups without a claim-discipline callout", () => {
    render(<AdminConfigurationEvidenceOrientationStrip />);

    expect(screen.queryByTestId("admin-configuration-claim-discipline")).not.toBeInTheDocument();
    expect(screen.getByText(ADMIN_CONFIGURATION_SOURCES_INTRO)).toBeInTheDocument();

    const sources = screen.getByTestId("admin-configuration-sources");

    for (const link of ADMIN_CONFIGURATION_SOURCES) {
      expect(within(sources).getByRole("link", { name: link.label })).toHaveAttribute("href", link.href);
    }

    expect(
      within(sources).queryByRole("link", { name: new RegExp(`^${ADMIN_CONFIGURATION_CANONICAL_PATH}$`, "i") }),
    ).not.toBeInTheDocument();
  });

  it("labels follow-ups for accessibility parity", () => {
    render(<AdminConfigurationEvidenceOrientationStrip />);
    expect(screen.getByRole("heading", { name: ADMIN_CONFIGURATION_FOLLOW_UPS_TITLE })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /Sources package/i })).toBeNull();
  });
});
