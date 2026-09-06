import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import {
  ARCHITECTURE_IDENTITY_LIST_PAGE_SUBTITLE,
  ARCHITECTURE_IDENTITY_LIST_PAGE_TITLE,
} from "@/lib/architecture/architecture-identity-desk-copy";
import {
  architectureIdentityDraftHref,
  architectureIdentityPath,
  ARCHITECTURES_LIST_PATH,
} from "@/lib/architecture/architecture-routes";
import {
  ARCHITECTURE_DRAFTS_LIST_LABEL,
  ARCHITECTURE_IDENTITIES_NAV_LABEL,
} from "@/lib/architecture/architecture-workflow-labels";
import {
  ARCHITECTURES_HUB_PAGE_SUBTITLE,
  ARCHITECTURES_HUB_PAGE_SUBTITLE_BUYER,
} from "@/lib/architectures-hub-copy";
import { OPERATOR_NAV_LINK_LABELS } from "@/lib/i18n";
import { resolveNavLinkPresentation } from "@/lib/operator/operator-nav-labels";

const UI_SRC_ROOT = path.join(process.cwd(), "src");

describe("architecture vocabulary drift guard (CA-48)", () => {
  it("pins Working nav label source to identities constant, not draft inventory constant", () => {
    const i18nSource = readFileSync(path.join(UI_SRC_ROOT, "lib/i18n.ts"), "utf8");

    expect(OPERATOR_NAV_LINK_LABELS.architectures).toBe(ARCHITECTURE_IDENTITIES_NAV_LABEL);
    expect(i18nSource).toContain("architectures: ARCHITECTURE_IDENTITIES_NAV_LABEL");
    expect(i18nSource).not.toMatch(/architectures:\s*ARCHITECTURE_DRAFTS_LIST_LABEL/);
  });

  it("keeps Guided nav presentation on draft inventory teaching labels", () => {
    const source = {
      href: ARCHITECTURES_LIST_PATH,
      label: "Draft inventory",
      title: "Draft inventory",
    };

    const guided = resolveNavLinkPresentation(source, false, false, false);

    expect(guided.label).toBe(ARCHITECTURE_DRAFTS_LIST_LABEL);
    expect(guided.title.toLowerCase()).toContain("saved architecture drafts");
  });

  it("keeps Working nav presentation on identity portfolio labels", () => {
    const source = {
      href: ARCHITECTURES_LIST_PATH,
      label: "Draft inventory",
      title: "Draft inventory",
    };

    const working = resolveNavLinkPresentation(source, false, false, true);

    expect(working.label).toBe(ARCHITECTURE_IDENTITY_LIST_PAGE_TITLE);
    expect(working.title).toContain(ARCHITECTURE_IDENTITY_LIST_PAGE_SUBTITLE);
    expect(working.title.toLowerCase()).not.toContain("saved architecture drafts");
  });

  it("fails Working hub identity subtitle if it reads as a draft inventory list", () => {
    const workingSubtitle = ARCHITECTURE_IDENTITY_LIST_PAGE_SUBTITLE.toLowerCase();

    expect(workingSubtitle).toContain("identit");
    expect(workingSubtitle).not.toContain("saved architecture drafts");
    expect(workingSubtitle).not.toMatch(/\bdraft inventory\b/);
    expect(workingSubtitle).not.toContain("sync across browsers");
  });

  it("allows Guided hub subtitles to teach draft inventory honestly", () => {
    expect(ARCHITECTURES_HUB_PAGE_SUBTITLE.toLowerCase()).toContain("draft");
    expect(ARCHITECTURES_HUB_PAGE_SUBTITLE_BUYER.toLowerCase()).toContain("draft");
  });

  it("pins identity+draft child href separately from legacy draft segment paths", () => {
    const routesSource = readFileSync(
      path.join(UI_SRC_ROOT, "lib/architecture/architecture-routes.ts"),
      "utf8",
    );

    expect(architectureIdentityDraftHref("architecture-identity-001", "draft-001")).toBe(
      "/architecture/architectures/architecture-identity-001?draft=draft-001",
    );
    expect(architectureIdentityPath("architecture-identity-001")).toBe(
      "/architecture/architectures/architecture-identity-001",
    );
    expect(routesSource).toMatch(
      /function architectureIdentityDraftHref\(architectureId: string, draftId: string\)/,
    );
    expect(routesSource).toMatch(/function architectureDraftPath\(draftId: string\)/);
    expect(routesSource).not.toMatch(/function architectureDraftPath\(architectureId: string\)/);
    expect(routesSource).not.toMatch(/function architectureDraftPath\(\s*id:\s*string\s*\)/);
  });
});
