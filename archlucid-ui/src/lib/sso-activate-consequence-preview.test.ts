import { describe, expect, it } from "vitest";

import {
  assertSsoActivateConsequencePreviewMatrixComplete,
  buildSsoActivateConsequencePreview,
  SSO_ACTIVATE_CONSEQUENCE_PREVIEW_TITLE,
  ssoActivateConsequencePreviewRowById,
} from "@/lib/sso-activate-consequence-preview";

describe("sso-activate-consequence-preview (TB-2241)", () => {
  it("covers sign-in path, stored record, and rollback with configuration-only framing", () => {
    assertSsoActivateConsequencePreviewMatrixComplete();

    const preview = buildSsoActivateConsequencePreview();

    expect(preview.title).toBe(SSO_ACTIVATE_CONSEQUENCE_PREVIEW_TITLE);
    expect(preview.summary.toLowerCase()).toContain("identity provider");
    expect(preview.summary.toLowerCase()).toContain("does not change how anyone signs in today");
    expect(preview.summary.toLowerCase()).toContain("separate platform configuration change");

    const who = ssoActivateConsequencePreviewRowById("whoSignsInNext");
    const unchanged = ssoActivateConsequencePreviewRowById("staysUnchangedUntilActivate");
    const rollback = ssoActivateConsequencePreviewRowById("rollsBackOrBypass");

    expect(who.label).toBe("Who signs in next");
    expect(who.detail.toLowerCase()).toContain("nobody's sign-in path changes");
    expect(who.detail.toLowerCase()).not.toContain("sign in through your organization's identity provider");

    expect(unchanged.label).toBe("What the record stores vs. what is in effect");
    expect(unchanged.detail.toLowerCase()).toContain("stored");
    expect(unchanged.detail.toLowerCase()).toContain("not yet used to sign anyone in");

    expect(rollback.label).toBe("What rolls back / bypass");
    expect(rollback.detail.toLowerCase()).toContain("overwrites");
    expect(rollback.detail.toLowerCase()).toContain("break-glass");
  });

  it("avoids engine/agent jargon in the preview", () => {
    const preview = buildSsoActivateConsequencePreview();
    const blob = `${preview.summary} ${preview.rows.map((row) => row.detail).join(" ")}`.toLowerCase();

    expect(blob).not.toContain("archlucidauth");
    expect(blob).not.toContain("tenantdatabasebindings");
    expect(blob).not.toContain("startup wiring");
  });
});
