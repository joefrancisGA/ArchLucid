import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SettingsMasterSectionNav } from "./SettingsMasterSectionNav";
import type { SettingsMasterVisibleSection } from "./settings-master-page-model";

const SECTIONS: readonly SettingsMasterVisibleSection[] = [
  {
    id: "workspace",
    navLabel: "Workspace",
    title: "Workspace",
    description: "Workspace settings",
    keywords: ["workspace"],
    tier: "common",
    destinations: [],
    showSupportBundle: false,
  },
  {
    id: "support",
    navLabel: "Support",
    title: "Support",
    description: "Support settings",
    keywords: ["support"],
    tier: "common",
    destinations: [],
    showSupportBundle: true,
  },
];

describe("SettingsMasterSectionNav (TB-1202)", () => {
  it("renders same-page section jumps as hash links", () => {
    render(<SettingsMasterSectionNav sections={SECTIONS} />);

    const workspaceLink = screen.getByRole("link", { name: "Workspace" });
    const supportLink = screen.getByRole("link", { name: "Support" });

    expect(workspaceLink).toHaveAttribute("href", "#settings-section-workspace");
    expect(supportLink).toHaveAttribute("href", "#settings-section-support");
  });
});
