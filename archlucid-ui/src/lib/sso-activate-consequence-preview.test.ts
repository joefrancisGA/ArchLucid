import { describe, expect, it } from "vitest";

import {
  assertSsoActivateConsequencePreviewMatrixComplete,
  buildSsoActivateConsequencePreview,
  SSO_ACTIVATE_CONSEQUENCE_PREVIEW_TITLE,
  ssoActivateConsequencePreviewRowById,
} from "@/lib/sso-activate-consequence-preview";

describe("sso-activate-consequence-preview (TB-2241)", () => {
  it("covers who signs in next, unchanged until activate, and rollback/bypass with buyer nouns", () => {
    assertSsoActivateConsequencePreviewMatrixComplete();

    const preview = buildSsoActivateConsequencePreview();

    expect(preview.title).toBe(SSO_ACTIVATE_CONSEQUENCE_PREVIEW_TITLE);
    expect(preview.summary.toLowerCase()).toContain("single sign-on");
    expect(preview.summary.toLowerCase()).toContain("identity provider");

    const who = ssoActivateConsequencePreviewRowById("whoSignsInNext");
    const unchanged = ssoActivateConsequencePreviewRowById("staysUnchangedUntilActivate");
    const rollback = ssoActivateConsequencePreviewRowById("rollsBackOrBypass");

    expect(who.label).toBe("Who signs in next");
    expect(who.detail.toLowerCase()).toContain("identity provider");
    expect(unchanged.label).toBe("What stays unchanged until activate");
    expect(unchanged.detail.toLowerCase()).toMatch(/draft|until/);
    expect(rollback.label).toBe("What rolls back / bypass");
    expect(rollback.detail.toLowerCase()).toMatch(/bypass|prior|break-glass|fail/);
  });

  it("avoids engine/agent jargon in the preview", () => {
    const preview = buildSsoActivateConsequencePreview();
    const blob = `${preview.summary} ${preview.rows.map((row) => row.detail).join(" ")}`.toLowerCase();

    expect(blob).not.toContain("archlucidauth");
    expect(blob).not.toContain("tenantdatabasebindings");
    expect(blob).not.toContain("startup wiring");
  });
});
