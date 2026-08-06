import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AiUsageSettingsEvidenceOrientationStrip } from "@/app/(operator)/administration/ai-usage/_sections/AiUsageSettingsEvidenceOrientationStrip";
import {
  AI_USAGE_SETTINGS_CANONICAL_PATH,
  AI_USAGE_SETTINGS_SOURCES,
} from "@/lib/ai-usage-settings-evidence-copy";

describe("AiUsageSettingsEvidenceOrientationStrip", () => {
  it("lists follow-up Sources without self-linking AI usage settings", () => {
    render(<AiUsageSettingsEvidenceOrientationStrip />);

    expect(screen.getByTestId("ai-usage-settings-sources")).toBeInTheDocument();
    expect(screen.getByTestId("ai-usage-settings-claim-discipline")).toBeInTheDocument();

    for (const link of AI_USAGE_SETTINGS_SOURCES) {
      expect(screen.getByRole("link", { name: link.label })).toHaveAttribute("href", link.href);
    }

    expect(
      AI_USAGE_SETTINGS_SOURCES.some((link) => link.href === AI_USAGE_SETTINGS_CANONICAL_PATH),
    ).toBe(false);
  });
});
