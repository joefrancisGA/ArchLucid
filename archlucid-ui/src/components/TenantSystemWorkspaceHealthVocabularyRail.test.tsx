import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { TenantSystemWorkspaceHealthVocabularyRail } from "@/components/TenantSystemWorkspaceHealthVocabularyRail";
import {
  TENANT_SYSTEM_WORKSPACE_HEALTH_COMPACT_LINE,
  TENANT_SYSTEM_WORKSPACE_HEALTH_HEADING,
  TENANT_SYSTEM_WORKSPACE_HEALTH_SYSTEM_LINK,
  TENANT_SYSTEM_WORKSPACE_HEALTH_TENANT_LINK,
  TENANT_SYSTEM_WORKSPACE_HEALTH_WHY_THREE,
  TENANT_SYSTEM_WORKSPACE_HEALTH_WORKSPACE_LINK,
} from "@/lib/vocabulary/tenant-system-workspace-health-vocabulary";

describe("TenantSystemWorkspaceHealthVocabularyRail (TB-2252)", () => {
  it("renders compact strip on tenant health with peer links", () => {
    render(
      <TenantSystemWorkspaceHealthVocabularyRail currentSurfaceId="tenant-health" />,
    );

    const strip = screen.getByTestId("tenant-system-workspace-health-vocabulary");
    expect(strip).toHaveAttribute("data-variant", "compact");
    expect(strip).toHaveAttribute("data-current-surface", "tenant-health");
    expect(strip.textContent ?? "").toContain(TENANT_SYSTEM_WORKSPACE_HEALTH_COMPACT_LINE);

    const systemPeer = screen.getByTestId(
      "tenant-system-workspace-health-vocabulary-peer-system-health",
    );
    expect(systemPeer).toHaveTextContent(TENANT_SYSTEM_WORKSPACE_HEALTH_SYSTEM_LINK.label);
    expect(systemPeer).toHaveAttribute("href", TENANT_SYSTEM_WORKSPACE_HEALTH_SYSTEM_LINK.href);

    const workspacePeer = screen.getByTestId(
      "tenant-system-workspace-health-vocabulary-peer-workspace-health",
    );
    expect(workspacePeer).toHaveTextContent(TENANT_SYSTEM_WORKSPACE_HEALTH_WORKSPACE_LINK.label);
    expect(workspacePeer).toHaveAttribute("href", TENANT_SYSTEM_WORKSPACE_HEALTH_WORKSPACE_LINK.href);
  });

  it("renders compact strip on system and workspace surfaces", () => {
    const { rerender } = render(
      <TenantSystemWorkspaceHealthVocabularyRail currentSurfaceId="system-health" />,
    );

    expect(screen.getByTestId("tenant-system-workspace-health-vocabulary")).toHaveAttribute(
      "data-current-surface",
      "system-health",
    );
    expect(
      screen.getByTestId("tenant-system-workspace-health-vocabulary-peer-tenant-health"),
    ).toHaveAttribute("href", TENANT_SYSTEM_WORKSPACE_HEALTH_TENANT_LINK.href);

    rerender(
      <TenantSystemWorkspaceHealthVocabularyRail currentSurfaceId="workspace-health" />,
    );

    expect(screen.getByTestId("tenant-system-workspace-health-vocabulary")).toHaveAttribute(
      "data-current-surface",
      "workspace-health",
    );
  });

  it("renders full variant with why-three and triad cards", () => {
    render(
      <TenantSystemWorkspaceHealthVocabularyRail
        currentSurfaceId="system-health"
        variant="full"
      />,
    );

    const strip = screen.getByTestId("tenant-system-workspace-health-vocabulary");
    expect(strip).toHaveAttribute("data-variant", "full");
    expect(screen.getByText(TENANT_SYSTEM_WORKSPACE_HEALTH_HEADING)).toBeInTheDocument();
    expect(screen.getByText(TENANT_SYSTEM_WORKSPACE_HEALTH_WHY_THREE)).toBeInTheDocument();
    expect(
      screen.getByTestId("tenant-system-workspace-health-vocabulary-job-tenant-health"),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("tenant-system-workspace-health-vocabulary-job-system-health"),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("tenant-system-workspace-health-vocabulary-job-workspace-health"),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("tenant-system-workspace-health-vocabulary-current"),
    ).toHaveTextContent(TENANT_SYSTEM_WORKSPACE_HEALTH_SYSTEM_LINK.label);
  });
});
