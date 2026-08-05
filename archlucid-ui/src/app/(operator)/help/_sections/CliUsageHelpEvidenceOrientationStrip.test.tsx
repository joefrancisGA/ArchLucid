import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { CliUsageHelpEvidenceOrientationStrip } from "@/app/(operator)/help/_sections/CliUsageHelpEvidenceOrientationStrip";
import {
  CLI_USAGE_HELP_CANONICAL_PATH,
  CLI_USAGE_HELP_SOURCES,
} from "@/lib/cli-usage-help-evidence-copy";

describe("CliUsageHelpEvidenceOrientationStrip", () => {
  it("lists follow-up Sources without self-linking cli-usage help", () => {
    render(<CliUsageHelpEvidenceOrientationStrip />);

    expect(screen.getByTestId("cli-usage-help-sources")).toBeInTheDocument();
    expect(screen.getByTestId("cli-usage-help-claim-discipline")).toBeInTheDocument();

    for (const link of CLI_USAGE_HELP_SOURCES) {
      expect(screen.getByRole("link", { name: link.label })).toHaveAttribute("href", link.href);
    }

    expect(CLI_USAGE_HELP_SOURCES.some((link) => link.href === CLI_USAGE_HELP_CANONICAL_PATH)).toBe(
      false,
    );
  });
});
