import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { PolicyPackWorkspaceSelectionItem } from "@/types/policy-packs";

import { PolicyPacksFeaturedSection } from "./PolicyPacksFeaturedSection";

function organizationPack(): PolicyPackWorkspaceSelectionItem {
  return {
    policyPackId: "created-org-pack",
    assignmentId: "assignment-1",
    name: "Organization security architecture starter",
    description: "Filled organization policy.",
    packType: "ProjectCustom",
    currentVersion: "1.0.0",
    isEnabled: true,
    isGloballyActive: false,
    isOrganizationRequired: false,
  };
}

describe("PolicyPacksFeaturedSection", () => {
  it("links to the existing authoring path with the organization starter selected", () => {
    render(<PolicyPacksFeaturedSection items={[]} />);

    const startLink = screen.getByTestId("policy-packs-start-organization-pack");

    expect(startLink).toHaveAttribute(
      "href",
      "/governance/policy-packs?tab=author&inputMode=visual&generatorTemplate=organization-security-architecture-starter",
    );
  });

  it("shows an organization pack in Featured with the Organization tag", () => {
    render(<PolicyPacksFeaturedSection items={[organizationPack()]} />);

    expect(screen.getByText("Organization security architecture starter")).toBeInTheDocument();
    expect(screen.getByText("Organization")).toBeInTheDocument();
  });
});
