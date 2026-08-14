import { readFileSync } from "node:fs";
import path from "node:path";

import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ExtractUploadSettingsEvidenceOrientationStrip } from "@/components/evidence-orientation/registry/claim-and-sources-strips";
import {
  EXTRACT_UPLOAD_SETTINGS_CANONICAL_PATH,
  EXTRACT_UPLOAD_SETTINGS_CLAIM_DISCIPLINE,
  EXTRACT_UPLOAD_SETTINGS_CLAIM_DISCIPLINE_HEADING,
  EXTRACT_UPLOAD_SETTINGS_CLAIM_HEADING_ID,
  EXTRACT_UPLOAD_SETTINGS_FOLLOW_UPS_TITLE,
  EXTRACT_UPLOAD_SETTINGS_SOURCES,
  EXTRACT_UPLOAD_SETTINGS_SOURCES_INTRO,
} from "@/lib/extract-upload-settings-evidence-copy";

describe("extract-upload-settings-evidence-copy", () => {
  it("wires exports into the Extract and Upload settings evidence strip registry", () => {
    const registryPath = path.join(
      process.cwd(),
      "src/components/evidence-orientation/registry/claim-and-sources-strips.tsx",
    );
    const registrySource = readFileSync(registryPath, "utf8");

    expect(registrySource).toContain("extract-upload-settings-evidence-copy");
    expect(registrySource).toContain("ExtractUploadSettingsEvidenceOrientationStrip");
    expect(EXTRACT_UPLOAD_SETTINGS_CANONICAL_PATH).toBe("/administration/extract-upload");
  });

  it("renders claim discipline and operator Sources follow-ups", () => {
    render(<ExtractUploadSettingsEvidenceOrientationStrip />);

    expect(screen.getByTestId("extract-upload-settings-claim-discipline")).toHaveTextContent(
      EXTRACT_UPLOAD_SETTINGS_CLAIM_DISCIPLINE,
    );
    expect(screen.getByText(EXTRACT_UPLOAD_SETTINGS_SOURCES_INTRO)).toBeInTheDocument();

    const sources = screen.getByTestId("extract-upload-settings-sources");

    for (const link of EXTRACT_UPLOAD_SETTINGS_SOURCES) {
      expect(within(sources).getByRole("link", { name: link.label })).toHaveAttribute("href", link.href);
    }

    expect(
      within(sources).queryByRole("link", { name: new RegExp(`^${EXTRACT_UPLOAD_SETTINGS_CANONICAL_PATH}$`, "i") }),
    ).not.toBeInTheDocument();
  });

  it("labels claim discipline and follow-ups for accessibility parity", () => {
    render(<ExtractUploadSettingsEvidenceOrientationStrip />);

    const claim = screen.getByTestId("extract-upload-settings-claim-discipline");
    expect(claim).toHaveAttribute("aria-labelledby", EXTRACT_UPLOAD_SETTINGS_CLAIM_HEADING_ID);
    expect(screen.getByRole("heading", { name: EXTRACT_UPLOAD_SETTINGS_CLAIM_DISCIPLINE_HEADING })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: EXTRACT_UPLOAD_SETTINGS_FOLLOW_UPS_TITLE })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /Sources package/i })).toBeNull();
  });
});
