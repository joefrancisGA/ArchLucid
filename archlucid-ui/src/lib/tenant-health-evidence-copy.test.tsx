import { readFileSync } from "node:fs";
import path from "node:path";

import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { TenantHealthEvidenceOrientationStrip } from "@/components/evidence-orientation/registry/claim-and-sources-strips";
import {
  TENANT_HEALTH_CANONICAL_PATH,
  TENANT_HEALTH_CLAIM_DISCIPLINE,
  TENANT_HEALTH_CLAIM_DISCIPLINE_HEADING,
  TENANT_HEALTH_CLAIM_HEADING_ID,
  TENANT_HEALTH_FOLLOW_UPS_TITLE,
  TENANT_HEALTH_SOURCES,
  TENANT_HEALTH_SOURCES_INTRO,
} from "@/lib/tenant-health-evidence-copy";

describe("tenant-health-evidence-copy", () => {
  it("wires exports into the Tenant health evidence strip registry", () => {
    const registryPath = path.join(
      process.cwd(),
      "src/components/evidence-orientation/registry/claim-and-sources-strips.tsx",
    );
    const registrySource = readFileSync(registryPath, "utf8");

    expect(registrySource).toContain("tenant-health-evidence-copy");
    expect(registrySource).toContain("TenantHealthEvidenceOrientationStrip");
    expect(TENANT_HEALTH_CANONICAL_PATH).toBe("/internal/tenant-health");
  });

  it("renders claim discipline and operator Sources follow-ups", () => {
    render(<TenantHealthEvidenceOrientationStrip />);

    expect(screen.getByTestId("tenant-health-claim-discipline")).toHaveTextContent(TENANT_HEALTH_CLAIM_DISCIPLINE);
    expect(screen.getByText(TENANT_HEALTH_SOURCES_INTRO)).toBeInTheDocument();

    const sources = screen.getByTestId("tenant-health-sources");

    for (const link of TENANT_HEALTH_SOURCES) {
      expect(within(sources).getByRole("link", { name: link.label })).toHaveAttribute("href", link.href);
    }

    expect(
      within(sources).queryByRole("link", { name: new RegExp(`^${TENANT_HEALTH_CANONICAL_PATH}$`, "i") }),
    ).not.toBeInTheDocument();
  });

  it("labels claim discipline and follow-ups for accessibility parity", () => {
    render(<TenantHealthEvidenceOrientationStrip />);

    const claim = screen.getByTestId("tenant-health-claim-discipline");
    expect(claim).toHaveAttribute("aria-labelledby", TENANT_HEALTH_CLAIM_HEADING_ID);
    expect(screen.getByRole("heading", { name: TENANT_HEALTH_CLAIM_DISCIPLINE_HEADING })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: TENANT_HEALTH_FOLLOW_UPS_TITLE })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /Sources package/i })).toBeNull();
  });
});
