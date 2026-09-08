import { render, screen } from "@testing-library/react";
import { Suspense, isValidElement } from "react";
import { describe, expect, it, vi } from "vitest";

vi.mock("./_sections/ScimProvisioningSettingsPageClient", () => ({
  ScimProvisioningSettingsPageClient: () => (
    <div data-testid="scim-provisioning-settings-page-client">SCIM client</div>
  ),
}));

import ScimProvisioningSettingsPage, { metadata } from "./page";
import { ScimProvisioningLoadingView } from "./ScimProvisioningLoadingView";

describe("ScimProvisioningSettingsPage", () => {
  it("exports metadata for the SCIM provisioning settings route", () => {
    expect(metadata.title).toBe("SCIM provisioning · ArchLucid");
    expect(metadata.description).toContain("identity provider");
  });

  it("wraps the client in Suspense with a SCIM loading fallback", () => {
    const element = ScimProvisioningSettingsPage();

    expect(isValidElement(element)).toBe(true);

    if (!isValidElement(element)) {
      throw new Error("Expected page export to be a React element.");
    }

    expect(element.type).toBe(Suspense);
    expect(element.props.fallback).toBeDefined();
  });

  it("renders the loading view with SCIM-specific copy", () => {
    render(<ScimProvisioningLoadingView />);

    expect(screen.getByRole("heading", { name: "SCIM provisioning" })).toBeInTheDocument();
    expect(screen.getByText(/loading scim provisioning settings/i)).toBeInTheDocument();
  });
});
