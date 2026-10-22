import { describe, expect, it } from "vitest";

import {
  ARTIFACT_PREVIEW_SPONSOR_EXPORT_COMPACT_LINE,
  ARTIFACT_PREVIEW_SPONSOR_EXPORT_HEADING,
  ARTIFACT_PREVIEW_SPONSOR_EXPORT_RECORDS_PEER_LINK,
  ARTIFACT_PREVIEW_SPONSOR_EXPORT_SPONSOR_LINK,
  ARTIFACT_PREVIEW_SPONSOR_EXPORT_WHY_TWO,
  buildArtifactPreviewSponsorExportHref,
  buildArtifactPreviewSponsorExportVocabulary,
  resolveArtifactPreviewSponsorExportPeerLink,
} from "@/lib/vocabulary/artifact-preview-sponsor-export-vocabulary";
import { SIGNED_RECORDS_LIST_PATH } from "@/lib/signed-records-paths";

describe("artifact-preview-sponsor-export-vocabulary (TB-2303)", () => {
  it("explains in-shell artifact preview vs sponsor package handoff", () => {
    const model = buildArtifactPreviewSponsorExportVocabulary();

    expect(model.heading).toBe(ARTIFACT_PREVIEW_SPONSOR_EXPORT_HEADING);
    expect(model.whyTwo).toBe(ARTIFACT_PREVIEW_SPONSOR_EXPORT_WHY_TWO);
    expect(model.whyTwo.toLowerCase()).toContain("artifact");
    expect(model.whyTwo.toLowerCase()).toContain("sponsor");
    expect(model.compactLine).toBe(ARTIFACT_PREVIEW_SPONSOR_EXPORT_COMPACT_LINE);
    expect(model.artifactPreviewLink).toEqual(ARTIFACT_PREVIEW_SPONSOR_EXPORT_RECORDS_PEER_LINK);
    expect(model.artifactPreviewLink.href).toBe(SIGNED_RECORDS_LIST_PATH);
    expect(model.sponsorExportLink.href).toBe("/architecture/sponsor-dashboard#sponsor-exports");
  });

  it("uses a specific artifact href when mounting on preview", () => {
    const artifactHref =
      "/governance/sealed-records/manifest-1/artifacts/cost-summary";
    const model = buildArtifactPreviewSponsorExportVocabulary({ artifactHref });

    expect(model.artifactPreviewLink.label).toBe("Artifact preview");
    expect(model.artifactPreviewLink.href).toBe(artifactHref);
  });

  it("scopes sponsor export to review handoff when runId is present", () => {
    expect(buildArtifactPreviewSponsorExportHref("run-abc")).toBe(
      "/architecture/reviews/run-abc#sponsor-handoff",
    );
    expect(buildArtifactPreviewSponsorExportHref()).toBe(
      ARTIFACT_PREVIEW_SPONSOR_EXPORT_SPONSOR_LINK.href,
    );

    const model = buildArtifactPreviewSponsorExportVocabulary({ runId: "run-abc" });

    expect(model.sponsorExportLink.href).toBe("/architecture/reviews/run-abc#sponsor-handoff");
  });

  it("resolves the peer surface from artifact preview and sponsor export", () => {
    const model = buildArtifactPreviewSponsorExportVocabulary({
      artifactHref: "/governance/sealed-records/m1/artifacts/a1",
      runId: "run-1",
    });

    expect(resolveArtifactPreviewSponsorExportPeerLink("artifact-preview", model)).toEqual(
      model.sponsorExportLink,
    );
    expect(resolveArtifactPreviewSponsorExportPeerLink("sponsor-export", model)).toEqual(
      model.artifactPreviewLink,
    );
  });
});
