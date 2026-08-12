import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { DeveloperSettingsPageClient } from "./DeveloperSettingsPageClient";
import {
  INTERNAL_DEVELOPER_TOOLS_ACCESS_NOTE,
  INTERNAL_DEVELOPER_TOOLS_INTRO,
  INTERNAL_DEVELOPER_TOOLS_SHIPPED_INVENTORY,
} from "./developer-settings-copy";

vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a>,
}));

vi.mock("@/components/usability/PageContextualHelpButton", () => ({
  PageContextualHelpButton: () => <button type="button">Page help</button>,
}));

describe("DeveloperSettingsPageClient", () => {
  it("surfaces only shipped internal developer tool widgets", () => {
    render(<DeveloperSettingsPageClient />);

    expect(screen.getByText(INTERNAL_DEVELOPER_TOOLS_INTRO)).toBeInTheDocument();
    expect(screen.getByTestId("developer-settings-access-note")).toHaveTextContent(
      INTERNAL_DEVELOPER_TOOLS_ACCESS_NOTE,
    );
    expect(screen.getByText(INTERNAL_DEVELOPER_TOOLS_SHIPPED_INVENTORY[0])).toBeInTheDocument();
    expect(screen.getByTestId("authority-theme-dev-selector")).toBeInTheDocument();
    expect(screen.getByTestId("try-cli-demo-card")).toBeInTheDocument();
    expect(screen.queryByTestId("developer-settings-sources")).toBeNull(); // TB-2092
    // No unshipped Diagnostics product widget — Sources may still link admin-diagnostics help.
    expect(screen.queryByRole("heading", { name: /^Diagnostics$/i })).not.toBeInTheDocument();
  });
});
