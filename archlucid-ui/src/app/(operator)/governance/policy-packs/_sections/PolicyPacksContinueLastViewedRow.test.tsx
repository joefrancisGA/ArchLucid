import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PolicyPacksContinueLastViewedRow } from "./PolicyPacksContinueLastViewedRow";

describe("PolicyPacksContinueLastViewedRow", () => {
  it("renders continue row with open link", () => {
    render(
      <PolicyPacksContinueLastViewedRow
        pack={{
          policyPackId: "pack-1",
          tenantId: "tenant-1",
          workspaceId: "workspace-1",
          projectId: "project-1",
          name: "Healthcare baseline",
          description: "desc",
          packType: "custom",
          distributionScope: "workspace",
          status: "active",
          createdUtc: "2026-01-01T00:00:00Z",
          activatedUtc: "2026-01-02T00:00:00Z",
          currentVersion: "1.0.0",
        }}
      />,
    );

    expect(screen.getByTestId("policy-packs-continue-last-viewed-row")).toBeInTheDocument();
    expect(screen.getByTestId("policy-packs-continue-last-viewed-open")).toHaveAttribute(
      "href",
      "/governance/policy-packs?packId=pack-1",
    );
  });
});
