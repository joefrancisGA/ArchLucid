import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

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

      expect(link).toHaveAttribute("href", `#${item.id}`);
    }

    expect(screen.getByRole("link", { name: "General" })).toHaveAttribute("aria-current", "page");
  });
});
