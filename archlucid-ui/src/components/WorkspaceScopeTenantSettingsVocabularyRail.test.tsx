import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { WorkspaceScopeTenantSettingsVocabularyRail } from "@/components/WorkspaceScopeTenantSettingsVocabularyRail";
import {
  WORKSPACE_SCOPE_TENANT_SETTINGS_COMPACT_LINE,
  WORKSPACE_SCOPE_TENANT_SETTINGS_HEADING,
  WORKSPACE_SCOPE_TENANT_SETTINGS_SCOPE_LINK,
  WORKSPACE_SCOPE_TENANT_SETTINGS_TENANT_LINK,
  WORKSPACE_SCOPE_TENANT_SETTINGS_WHY_TWO,
} from "@/lib/vocabulary/workspace-scope-tenant-settings-vocabulary";

describe("WorkspaceScopeTenantSettingsVocabularyRail (TB-2317)", () => {
  it("renders workspace-scope strip with peer link to tenant settings", () => {
    render(
      <WorkspaceScopeTenantSettingsVocabularyRail currentSurfaceId="workspace-scope" />,
    );

    const strip = screen.getByTestId("workspace-scope-tenant-settings-vocabulary");
    expect(strip).toHaveAttribute("data-current-surface", "workspace-scope");
    expect(strip.textContent ?? "").toContain(WORKSPACE_SCOPE_TENANT_SETTINGS_COMPACT_LINE);

    const peer = screen.getByTestId("workspace-scope-tenant-settings-vocabulary-peer-link");
    expect(peer).toHaveTextContent(WORKSPACE_SCOPE_TENANT_SETTINGS_TENANT_LINK.label);
    expect(peer).toHaveAttribute("href", WORKSPACE_SCOPE_TENANT_SETTINGS_TENANT_LINK.href);
  });

  it("renders tenant-settings strip with peer link to workspace scope", () => {
    render(
      <WorkspaceScopeTenantSettingsVocabularyRail currentSurfaceId="tenant-settings" />,
    );

    const peer = screen.getByTestId("workspace-scope-tenant-settings-vocabulary-peer-link");
    expect(peer).toHaveTextContent(WORKSPACE_SCOPE_TENANT_SETTINGS_SCOPE_LINK.label);
    expect(peer).toHaveAttribute("href", WORKSPACE_SCOPE_TENANT_SETTINGS_SCOPE_LINK.href);
  });

  it("accepts a currentLabel override on the tenant-settings surface", () => {
    render(
      <WorkspaceScopeTenantSettingsVocabularyRail
        currentSurfaceId="tenant-settings"
        currentLabel="Workspace settings"
        variant="full"
      />,
    );

    expect(screen.getByTestId("workspace-scope-tenant-settings-vocabulary-current")).toHaveTextContent(
      "Workspace settings",
    );
    expect(screen.queryByText(WORKSPACE_SCOPE_TENANT_SETTINGS_TENANT_LINK.label)).not.toBeInTheDocument();
  });

  it("renders full variant with why-two explanation", () => {
    render(
      <WorkspaceScopeTenantSettingsVocabularyRail
        currentSurfaceId="workspace-scope"
        variant="full"
      />,
    );

    expect(screen.getByText(WORKSPACE_SCOPE_TENANT_SETTINGS_HEADING)).toBeInTheDocument();
    expect(screen.getByText(WORKSPACE_SCOPE_TENANT_SETTINGS_WHY_TWO)).toBeInTheDocument();
  });
});
