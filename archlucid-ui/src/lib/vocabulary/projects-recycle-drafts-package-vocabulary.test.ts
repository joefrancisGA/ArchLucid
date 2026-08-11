import { describe, expect, it } from "vitest";

import {
  PROJECTS_RECYCLE_BIN_PATH,
  PROJECTS_RECYCLE_DRAFTS_PACKAGE_COMPACT_LINE,
  PROJECTS_RECYCLE_DRAFTS_PACKAGE_DRAFTS_LINK,
  PROJECTS_RECYCLE_DRAFTS_PACKAGE_HEADING,
  PROJECTS_RECYCLE_DRAFTS_PACKAGE_PACKAGE_LINK,
  PROJECTS_RECYCLE_DRAFTS_PACKAGE_RECYCLE_LINK,
  PROJECTS_RECYCLE_DRAFTS_PACKAGE_RESTORE_RESIDUE_HONESTY,
  PROJECTS_RECYCLE_DRAFTS_PACKAGE_WHY_THREE,
  buildProjectsRecycleDraftsPackageVocabulary,
  resolveProjectsRecycleDraftsPackageLink,
  resolveProjectsRecycleDraftsPackagePeerLinks,
} from "@/lib/vocabulary/projects-recycle-drafts-package-vocabulary";
import {
  ARCHITECTURES_LIST_PATH,
  REVIEWS_LIST_PATH,
} from "@/lib/architecture-routes";

describe("projects-recycle-drafts-package-vocabulary (TB-2251)", () => {
  it("explains the recycle / drafts / package triad and deep-links all three", () => {
    const model = buildProjectsRecycleDraftsPackageVocabulary();

    expect(model.heading).toBe(PROJECTS_RECYCLE_DRAFTS_PACKAGE_HEADING);
    expect(model.whyThree).toBe(PROJECTS_RECYCLE_DRAFTS_PACKAGE_WHY_THREE);
    expect(model.whyThree.toLowerCase()).toContain("soft-delete");
    expect(model.whyThree.toLowerCase()).toContain("architecture package");
    expect(model.whyThree.toLowerCase()).toContain("draft");
    expect(model.compactLine).toBe(PROJECTS_RECYCLE_DRAFTS_PACKAGE_COMPACT_LINE);
    expect(model.restoreResidueHonesty).toBe(PROJECTS_RECYCLE_DRAFTS_PACKAGE_RESTORE_RESIDUE_HONESTY);
    expect(model.restoreResidueHonesty.toLowerCase()).toContain("soft-delete");
    expect(model.restoreResidueHonesty.toLowerCase()).toContain("erase");
    expect(model.restoreResidueHonesty.toLowerCase()).toContain("architecture package");

    expect(model.recycleLink).toEqual(PROJECTS_RECYCLE_DRAFTS_PACKAGE_RECYCLE_LINK);
    expect(model.recycleLink.href).toBe(PROJECTS_RECYCLE_BIN_PATH);
    expect(model.recycleLink.href).toBe("/administration/tenant/recycle-bin");

    expect(model.draftsLink).toEqual(PROJECTS_RECYCLE_DRAFTS_PACKAGE_DRAFTS_LINK);
    expect(model.draftsLink.href).toBe(ARCHITECTURES_LIST_PATH);

    expect(model.packageLink).toEqual(PROJECTS_RECYCLE_DRAFTS_PACKAGE_PACKAGE_LINK);
    expect(model.packageLink.href).toBe(REVIEWS_LIST_PATH);
  });

  it("resolves current and peer links for each surface", () => {
    expect(resolveProjectsRecycleDraftsPackageLink("projects-recycle")).toEqual(
      PROJECTS_RECYCLE_DRAFTS_PACKAGE_RECYCLE_LINK,
    );
    expect(resolveProjectsRecycleDraftsPackageLink("architecture-drafts")).toEqual(
      PROJECTS_RECYCLE_DRAFTS_PACKAGE_DRAFTS_LINK,
    );
    expect(resolveProjectsRecycleDraftsPackageLink("architecture-packages")).toEqual(
      PROJECTS_RECYCLE_DRAFTS_PACKAGE_PACKAGE_LINK,
    );

    expect(resolveProjectsRecycleDraftsPackagePeerLinks("projects-recycle")).toEqual([
      PROJECTS_RECYCLE_DRAFTS_PACKAGE_DRAFTS_LINK,
      PROJECTS_RECYCLE_DRAFTS_PACKAGE_PACKAGE_LINK,
    ]);
    expect(resolveProjectsRecycleDraftsPackagePeerLinks("architecture-drafts")).toEqual([
      PROJECTS_RECYCLE_DRAFTS_PACKAGE_RECYCLE_LINK,
      PROJECTS_RECYCLE_DRAFTS_PACKAGE_PACKAGE_LINK,
    ]);
    expect(resolveProjectsRecycleDraftsPackagePeerLinks("architecture-packages")).toEqual([
      PROJECTS_RECYCLE_DRAFTS_PACKAGE_RECYCLE_LINK,
      PROJECTS_RECYCLE_DRAFTS_PACKAGE_DRAFTS_LINK,
    ]);
  });
});
