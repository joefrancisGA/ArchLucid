import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  usePathname: () => "/administration/workspace-settings",
  useSearchParams: () => new URLSearchParams(),
}));

import {
  TENANT_SETTINGS_SECTION_NAV_ITEMS,
  TenantSettingsSectionNav,
} from "./TenantSettingsSectionNav";

describe("TenantSettingsSectionNav", () => {
  it("renders same-page links for every workspace settings section", () => {
    render(<TenantSettingsSectionNav />);

    const nav = screen.getByRole("navigation", { name: "Workspace settings sections" });

    expect(nav).toBeInTheDocument();

    for (const item of TENANT_SETTINGS_SECTION_NAV_ITEMS) {
      const link = screen.getByRole("link", { name: item.label });

      if (item.id === "tenant-settings-section-advanced") {
        expect(link).toHaveAttribute("href", "/administration/workspace-settings?settingsQualityAdvancedOpen=1");
      } else {
        expect(link).toHaveAttribute("href", `#${item.id}`);
      }
    }

    expect(screen.getByRole("link", { name: "General" })).toHaveAttribute("aria-current", "page");
  });
});
