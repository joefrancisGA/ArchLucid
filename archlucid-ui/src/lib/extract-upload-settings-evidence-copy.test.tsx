import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { expectFollowUpLink } from "@/lib/claim-discipline-test-helpers";

vi.mock("next/navigation", async (importOriginal) => {
  const { extendNextNavigationVitestMock } = await import("@/testing/next-navigation-vitest-mock");

  return extendNextNavigationVitestMock(importOriginal, {
    usePathname: () => "/administration/extract-upload",
  });
});

import { ExtractUploadSettingsEvidenceOrientationStrip } from "@/components/evidence-orientation/registry/claim-and-sources-strips";
import {
  EXTRACT_UPLOAD_SETTINGS_CANONICAL_PATH,
  EXTRACT_UPLOAD_SETTINGS_FOLLOW_UPS_TITLE,
  EXTRACT_UPLOAD_SETTINGS_ORIENTATION_SOURCES,
  EXTRACT_UPLOAD_SETTINGS_SOURCES,
  EXTRACT_UPLOAD_SETTINGS_SOURCES_INTRO,
} from "@/lib/extract-upload-settings-evidence-copy";
import { filterWhereToGoNextFollowUpLinks } from "@/lib/evidence-orientation/where-to-go-next-follow-up-links";
import { filterOrientationSourcesForJobContext } from "@/lib/evidence-orientation/job-context-orientation-sources-filter";

describe("extract-upload-settings-evidence-copy", () => {
  it("publishes its canonical operator path", () => {
    expect(EXTRACT_UPLOAD_SETTINGS_CANONICAL_PATH).toBe("/administration/extract-upload");
  });

  it("renders claim discipline and operator Sources follow-ups", () => {
    render(<ExtractUploadSettingsEvidenceOrientationStrip />);

    expect(screen.queryByTestId("extract-upload-settings-claim-discipline")).not.toBeInTheDocument();
    expect(screen.getByText(EXTRACT_UPLOAD_SETTINGS_SOURCES_INTRO)).toBeInTheDocument();

    const sources = screen.getByTestId("extract-upload-settings-sources");

    const expectedLinks = filterOrientationSourcesForJobContext(
      filterWhereToGoNextFollowUpLinks(EXTRACT_UPLOAD_SETTINGS_SOURCES),
      EXTRACT_UPLOAD_SETTINGS_CANONICAL_PATH,
    );

    expect(within(sources).getAllByRole("link")).toHaveLength(expectedLinks.length);

    for (const link of expectedLinks) {
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

  it("keeps Architecture reviews in orientation Sources after Go to Reviews CTA removal", () => {
    const orientationHrefs = EXTRACT_UPLOAD_SETTINGS_ORIENTATION_SOURCES.map((source) => source.href);

    expect(orientationHrefs).toContain("/architecture/reviews");
    expect(EXTRACT_UPLOAD_SETTINGS_ORIENTATION_SOURCES).toEqual(EXTRACT_UPLOAD_SETTINGS_SOURCES);
  });
});
