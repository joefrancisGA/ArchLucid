import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { DeveloperSettingsPageClient } from "./DeveloperSettingsPageClient";
import { INTERNAL_DEVELOPER_TOOLS_INTRO, INTERNAL_DEVELOPER_TOOLS_SHIPPED_INVENTORY } from "./developer-settings-copy";

vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a>,
}));

describe("DeveloperSettingsPageClient", () => {
  it("surfaces only shipped internal developer tool widgets", () => {
    render(<DeveloperSettingsPageClient />);

    expect(screen.getByText(INTERNAL_DEVELOPER_TOOLS_INTRO)).toBeInTheDocument();
    expect(screen.getByText(INTERNAL_DEVELOPER_TOOLS_SHIPPED_INVENTORY[0])).toBeInTheDocument();
    expect(screen.getByTestId("authority-theme-dev-selector")).toBeInTheDocument();
    expect(screen.getByTestId("try-cli-demo-card")).toBeInTheDocument();
    expect(screen.queryByText(/diagnostics/i)).not.toBeInTheDocument();
  });
});
