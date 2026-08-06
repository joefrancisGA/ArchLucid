import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ModelGovernanceSettingsEvidenceOrientationStrip } from "@/app/(operator)/administration/model-governance/_sections/ModelGovernanceSettingsEvidenceOrientationStrip";
import {
  MODEL_GOVERNANCE_SETTINGS_CANONICAL_PATH,
  MODEL_GOVERNANCE_SETTINGS_SOURCES,
} from "@/lib/model-governance-settings-evidence-copy";

describe("ModelGovernanceSettingsEvidenceOrientationStrip", () => {
  it("lists follow-up Sources without self-linking model governance", () => {
    render(<ModelGovernanceSettingsEvidenceOrientationStrip />);

    expect(screen.getByTestId("model-governance-settings-sources")).toBeInTheDocument();
    expect(screen.getByTestId("model-governance-settings-claim-discipline")).toBeInTheDocument();

    for (const link of MODEL_GOVERNANCE_SETTINGS_SOURCES) {
      expect(screen.getByRole("link", { name: link.label })).toHaveAttribute("href", link.href);
    }

    expect(
      MODEL_GOVERNANCE_SETTINGS_SOURCES.some(
        (link) => link.href === MODEL_GOVERNANCE_SETTINGS_CANONICAL_PATH,
      ),
    ).toBe(false);
  });
});
