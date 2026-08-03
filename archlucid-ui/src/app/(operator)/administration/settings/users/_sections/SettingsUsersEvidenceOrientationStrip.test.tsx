import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SettingsUsersEvidenceOrientationStrip } from "@/app/(operator)/administration/settings/users/_sections/SettingsUsersEvidenceOrientationStrip";
import {
  SETTINGS_USERS_CANONICAL_PATH,
  SETTINGS_USERS_SOURCES,
} from "@/lib/settings-users-evidence-copy";

describe("SettingsUsersEvidenceOrientationStrip", () => {
  it("lists follow-up Sources without self-linking users settings", () => {
    render(<SettingsUsersEvidenceOrientationStrip />);

    expect(screen.getByTestId("settings-users-sources")).toBeInTheDocument();
    expect(screen.getByTestId("settings-users-claim-discipline")).toHaveTextContent(
      /Access configuration|CPA SOC 2|third-party pen/i,
    );

    const sources = screen.getByTestId("settings-users-sources");

    for (const link of SETTINGS_USERS_SOURCES) {
      expect(within(sources).getByRole("link", { name: link.label })).toHaveAttribute("href", link.href);
    }

    expect(SETTINGS_USERS_SOURCES.some((link) => link.href === SETTINGS_USERS_CANONICAL_PATH)).toBe(false);
  });
});
