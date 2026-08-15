import { readFileSync } from "node:fs";
import path from "node:path";

import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AdminItsmConnectorsEvidenceOrientationStrip } from "@/components/evidence-orientation/registry/claim-and-sources-strips";
import {
  ADMIN_ITSM_CONNECTORS_CANONICAL_PATH,
  ADMIN_ITSM_CONNECTORS_FOLLOW_UPS_TITLE,
  ADMIN_ITSM_CONNECTORS_SOURCES,
  ADMIN_ITSM_CONNECTORS_SOURCES_INTRO,
} from "@/lib/admin-itsm-connectors-evidence-copy";

describe("admin-itsm-connectors-evidence-copy", () => {
  it("wires exports into the ITSM connectors evidence strip registry", () => {
    const registryPath = path.join(
      process.cwd(),
      "src/components/evidence-orientation/registry/claim-and-sources-strips.tsx",
    );
    const registrySource = readFileSync(registryPath, "utf8");

    expect(registrySource).toContain("admin-itsm-connectors-evidence-copy");
    expect(registrySource).toContain("AdminItsmConnectorsEvidenceOrientationStrip");
    expect(ADMIN_ITSM_CONNECTORS_CANONICAL_PATH).toBe("/internal/integrations/itsm");
  });

  it("renders operator Sources follow-ups without a claim-discipline callout", () => {
    render(<AdminItsmConnectorsEvidenceOrientationStrip />);

    expect(screen.queryByTestId("admin-itsm-connectors-claim-discipline")).not.toBeInTheDocument();
    expect(screen.getByText(ADMIN_ITSM_CONNECTORS_SOURCES_INTRO)).toBeInTheDocument();

    const sources = screen.getByTestId("admin-itsm-connectors-sources");

    for (const link of ADMIN_ITSM_CONNECTORS_SOURCES) {
      expect(within(sources).getByRole("link", { name: link.label })).toHaveAttribute("href", link.href);
    }

    expect(
      within(sources).queryByRole("link", { name: new RegExp(`^${ADMIN_ITSM_CONNECTORS_CANONICAL_PATH}$`, "i") }),
    ).not.toBeInTheDocument();
  });

  it("labels follow-ups for accessibility parity", () => {
    render(<AdminItsmConnectorsEvidenceOrientationStrip />);
    expect(screen.getByRole("heading", { name: ADMIN_ITSM_CONNECTORS_FOLLOW_UPS_TITLE })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /Sources package/i })).toBeNull();
  });
});
