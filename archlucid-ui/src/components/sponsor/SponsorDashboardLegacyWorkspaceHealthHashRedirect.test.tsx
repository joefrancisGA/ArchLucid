import { render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { SponsorDashboardLegacyWorkspaceHealthHashRedirect } from "@/components/sponsor/SponsorDashboardLegacyWorkspaceHealthHashRedirect";
import { WORKSPACE_HEALTH_PATH } from "@/lib/workspace-health-route";

const replace = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    replace,
  }),
}));

describe("SponsorDashboardLegacyWorkspaceHealthHashRedirect", () => {
  beforeEach(() => {
    replace.mockClear();
    window.history.replaceState({}, "", "/");
    window.location.hash = "";
  });

  it("redirects on mount when the legacy hash is present", () => {
    window.location.hash = "#workspace-health";

    render(<SponsorDashboardLegacyWorkspaceHealthHashRedirect />);

    expect(replace).toHaveBeenCalledWith(WORKSPACE_HEALTH_PATH);
  });

  it("redirects when the hash changes to the legacy fragment", () => {
    window.location.hash = "";

    render(<SponsorDashboardLegacyWorkspaceHealthHashRedirect />);

    replace.mockClear();
    window.location.hash = "#workspace-health";
    window.dispatchEvent(new HashChangeEvent("hashchange"));

    expect(replace).toHaveBeenCalledWith(WORKSPACE_HEALTH_PATH);
  });

  it("preserves the query string when redirecting legacy bookmarks", () => {
    window.history.replaceState({}, "", "/architecture/sponsor-dashboard?utm=foo#workspace-health");

    render(<SponsorDashboardLegacyWorkspaceHealthHashRedirect />);

    expect(replace).toHaveBeenCalledWith(`${WORKSPACE_HEALTH_PATH}?utm=foo`);
  });

  it("does not redirect for unrelated hashes", () => {
    window.location.hash = "#roi";

    render(<SponsorDashboardLegacyWorkspaceHealthHashRedirect />);

    expect(replace).not.toHaveBeenCalled();
  });
});
