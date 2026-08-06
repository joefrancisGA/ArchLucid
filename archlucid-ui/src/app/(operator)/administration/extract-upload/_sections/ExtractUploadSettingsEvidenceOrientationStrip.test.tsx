import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ExtractUploadSettingsEvidenceOrientationStrip } from "@/app/(operator)/administration/extract-upload/_sections/ExtractUploadSettingsEvidenceOrientationStrip";
import {
  EXTRACT_UPLOAD_SETTINGS_CANONICAL_PATH,
  EXTRACT_UPLOAD_SETTINGS_SOURCES,
} from "@/lib/extract-upload-settings-evidence-copy";

describe("ExtractUploadSettingsEvidenceOrientationStrip", () => {
  it("lists follow-up Sources without self-linking Extract and Upload", () => {
    render(<ExtractUploadSettingsEvidenceOrientationStrip />);

    expect(screen.getByTestId("extract-upload-settings-sources")).toBeInTheDocument();
    expect(screen.getByTestId("extract-upload-settings-claim-discipline")).toBeInTheDocument();

    for (const link of EXTRACT_UPLOAD_SETTINGS_SOURCES) {
      expect(screen.getByRole("link", { name: link.label })).toHaveAttribute("href", link.href);
    }

    expect(
      EXTRACT_UPLOAD_SETTINGS_SOURCES.some((link) => link.href === EXTRACT_UPLOAD_SETTINGS_CANONICAL_PATH),
    ).toBe(false);
  });
});
