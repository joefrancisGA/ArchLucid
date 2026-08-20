import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { expectFollowUpLink } from "@/lib/claim-discipline-test-helpers";

import { ExtractUploadSettingsEvidenceOrientationStrip } from "@/components/evidence-orientation/registry/claim-and-sources-strips";
import {
  EXTRACT_UPLOAD_SETTINGS_CANONICAL_PATH,
  EXTRACT_UPLOAD_SETTINGS_FOLLOW_UPS_TITLE,
  EXTRACT_UPLOAD_SETTINGS_ORIENTATION_SOURCES,
  EXTRACT_UPLOAD_SETTINGS_SOURCES,
  EXTRACT_UPLOAD_SETTINGS_SOURCES_INTRO,
} from "@/lib/extract-upload-settings-evidence-copy";

describe("extract-upload-settings-evidence-copy", () => {
  it("publishes its canonical operator path", () => {
    expect(EXTRACT_UPLOAD_SETTINGS_CANONICAL_PATH).toBe("/administration/extract-upload");
  });

  it("renders claim discipline and operator Sources follow-ups", () => {
    render(<ExtractUploadSettingsEvidenceOrientationStrip />);

    expect(screen.queryByTestId("extract-upload-settings-claim-discipline")).not.toBeInTheDocument();
    expect(screen.getByText(EXTRACT_UPLOAD_SETTINGS_SOURCES_INTRO)).toBeInTheDocument();

    const sources = screen.getByTestId("extract-upload-settings-sources");

    for (const link of EXTRACT_UPLOAD_SETTINGS_SOURCES) {
      expectFollowUpLink(within(sources), link);
    }

    expect(
      within(sources).queryByRole("link", { name: new RegExp(`^${EXTRACT_UPLOAD_SETTINGS_CANONICAL_PATH}$`, "i") }),
    ).not.toBeInTheDocument();
  });

  it("labels claim discipline and follow-ups for accessibility parity", () => {
    render(<ExtractUploadSettingsEvidenceOrientationStrip />);
    expect(screen.getByRole("heading", { name: EXTRACT_UPLOAD_SETTINGS_FOLLOW_UPS_TITLE })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /Sources package/i })).toBeNull();
  });

  it("excludes Go to Reviews destination from orientation Sources", () => {
    const orientationHrefs = EXTRACT_UPLOAD_SETTINGS_ORIENTATION_SOURCES.map((source) => source.href);

    expect(orientationHrefs).not.toContain("/architecture/reviews");
    expect(EXTRACT_UPLOAD_SETTINGS_ORIENTATION_SOURCES.length).toBeLessThan(EXTRACT_UPLOAD_SETTINGS_SOURCES.length);
    expect(EXTRACT_UPLOAD_SETTINGS_ORIENTATION_SOURCES.length).toBeGreaterThan(0);
  });
});
