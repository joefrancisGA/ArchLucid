import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import {
  ARCHITECTURES_NEW_PATH,
  REVIEWS_NEW_PATH,
} from "@/lib/architecture/architecture-routes";
import {
  CREATE_ARCHITECTURE_LABEL,
  START_REVIEW_LABEL,
  WORKING_NEW_REVIEW_LABEL,
} from "@/lib/architecture/architecture-workflow-labels";
import {
  resolveNavLinkPresentation,
  resolveQuickActionNavLinkPresentation,
} from "@/lib/operator/operator-nav-labels";
import {
  isWorkingSingleStartNavHref,
  resolveWorkingSingleStartNavPresentation,
  SYSTEM_NOT_JOB_NO_CREATE_ARCHITECTURE_VS_REVIEW_FORK_WORKING_DOC_ANCHOR,
  SYSTEM_NOT_JOB_NO_CREATE_ARCHITECTURE_VS_REVIEW_FORK_WORKING_OWNER,
  WORKING_NAV_BANNED_PEER_START_LABELS,
  WORKING_SINGLE_START_NAV_TOOLTIP,
} from "@/lib/system-not-job-no-create-architecture-vs-review-fork-working";

const REPO_ROOT = join(process.cwd(), "..");

describe("SN-028 Working nav does not fork create vs review", () => {
  it("collapses both start hrefs to New review with sequence-shaped tooltip", () => {
    for (const href of [ARCHITECTURES_NEW_PATH, REVIEWS_NEW_PATH]) {
      expect(isWorkingSingleStartNavHref(href)).toBe(true);
      expect(resolveWorkingSingleStartNavPresentation(href)).toEqual({
        label: WORKING_NEW_REVIEW_LABEL,
        title: WORKING_SINGLE_START_NAV_TOOLTIP,
      });
    }
  });

  it("resolveNavLinkPresentation uses single start verb in Working mode", () => {
    for (const href of [ARCHITECTURES_NEW_PATH, REVIEWS_NEW_PATH]) {
      const presentation = resolveNavLinkPresentation(
        { href, label: "Legacy", title: "Legacy tooltip" },
        false,
        false,
        true,
      );

      expect(presentation.label).toBe(WORKING_NEW_REVIEW_LABEL);
      expect(presentation.title).toBe(WORKING_SINGLE_START_NAV_TOOLTIP);
      expect(WORKING_NAV_BANNED_PEER_START_LABELS).toContain(CREATE_ARCHITECTURE_LABEL);
      expect(WORKING_NAV_BANNED_PEER_START_LABELS).toContain(START_REVIEW_LABEL);
      expect(presentation.label).not.toBe(CREATE_ARCHITECTURE_LABEL);
      expect(presentation.label).not.toBe(START_REVIEW_LABEL);
    }
  });

  it("keeps Guided buyer-polished peer labels for create and start review", () => {
    const createPresentation = resolveNavLinkPresentation(
      { href: ARCHITECTURES_NEW_PATH, label: "Capture", title: "Create" },
      true,
      false,
      false,
    );
    const startPresentation = resolveNavLinkPresentation(
      { href: REVIEWS_NEW_PATH, label: "Capture", title: "Start" },
      true,
      false,
      false,
    );

    expect(createPresentation.label).toBe(CREATE_ARCHITECTURE_LABEL);
    expect(startPresentation.label).toBe(START_REVIEW_LABEL);
  });

  it("resolveQuickActionNavLinkPresentation collapses Working quick actions", () => {
    for (const href of [ARCHITECTURES_NEW_PATH, REVIEWS_NEW_PATH]) {
      const presentation = resolveQuickActionNavLinkPresentation(
        { href, label: "Legacy", title: "Legacy" },
        true,
      );

      expect(presentation.label).toBe(WORKING_NEW_REVIEW_LABEL);
      expect(presentation.title).toBe(WORKING_SINGLE_START_NAV_TOOLTIP);
    }
  });

  it("wires operator-nav-labels to SN-028 resolver and ADR 0069 anchor", () => {
    const navLabels = readFileSync(
      join(REPO_ROOT, "archlucid-ui/src/lib/operator/operator-nav-labels.ts"),
      "utf8",
    );

    expect(navLabels).toContain("resolveWorkingSingleStartNavPresentation");
    expect(navLabels).toContain("WORKING_SINGLE_START_NAV_TOOLTIP");
    expect(existsSync(join(REPO_ROOT, SYSTEM_NOT_JOB_NO_CREATE_ARCHITECTURE_VS_REVIEW_FORK_WORKING_DOC_ANCHOR))).toBe(
      true,
    );
    expect(SYSTEM_NOT_JOB_NO_CREATE_ARCHITECTURE_VS_REVIEW_FORK_WORKING_OWNER).toBe("SN-028");
    expect(SYSTEM_NOT_JOB_NO_CREATE_ARCHITECTURE_VS_REVIEW_FORK_WORKING_DOC_ANCHOR).toContain("0069");
  });
});
