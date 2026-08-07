import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { DeveloperSettingsEvidenceOrientationStrip } from "@/app/(operator)/administration/developer/DeveloperSettingsEvidenceOrientationStrip";
import {
  DEVELOPER_SETTINGS_CANONICAL_PATH,
  DEVELOPER_SETTINGS_SOURCES,
} from "@/lib/developer-settings-evidence-copy";

describe("DeveloperSettingsEvidenceOrientationStrip", () => {
  it("lists follow-up Sources without self-linking Internal developer tools", () => {
    render(<DeveloperSettingsEvidenceOrientationStrip />);

    expect(screen.getByTestId("developer-settings-sources")).toBeInTheDocument();
    expect(screen.getByTestId("developer-settings-claim-discipline")).toBeInTheDocument();

    for (const link of DEVELOPER_SETTINGS_SOURCES) {
      expect(screen.getByRole("link", { name: link.label })).toHaveAttribute("href", link.href);
    }

    expect(
      DEVELOPER_SETTINGS_SOURCES.some((link) => link.href === DEVELOPER_SETTINGS_CANONICAL_PATH),
    ).toBe(false);
  });
});
