import { describe, expect, it } from "vitest";

import {
  ARCHLUCID_SUPPORT_EMAIL,
  buildSupportRequestMailtoHref,
  buildSupportRequestTemplate,
  classifySupportBundleDownloadError,
  resolveSupportBundleStatusLabel,
  resolveSupportBundleStatusTag,
  resolveSupportTroubleshootingHref,
} from "@/lib/support-workspace-present";

describe("support-workspace-present", () => {
  it("builds a support request template with workspace label", () => {
    const template = buildSupportRequestTemplate("Pilot workspace");

    expect(template).toContain("Workspace: Pilot workspace");
    expect(template).toContain("Support bundle attached: No");
  });

  it("uses placeholder workspace when label is missing", () => {
    expect(buildSupportRequestTemplate(null)).toContain("Workspace: [Workspace name]");
  });

  it("classifies permission errors", () => {
    expect(classifySupportBundleDownloadError(403, "")).toBe("permission_required");
    expect(classifySupportBundleDownloadError(500, "boom")).toBe("failed");
  });

  it("formats bundle status labels", () => {
    expect(resolveSupportBundleStatusLabel("idle", null)).toContain("No support bundle generated");
    expect(resolveSupportBundleStatusLabel("permission_required", null)).toContain("Execute authority");
    expect(resolveSupportBundleStatusLabel("ready", new Date("2026-07-07T12:00:00Z"))).toContain(
      "Download ready",
    );
  });

  it("resolves troubleshooting hrefs", () => {
    expect(resolveSupportTroubleshootingHref("help:troubleshooting")).toBe("/help/troubleshooting");
    expect(resolveSupportTroubleshootingHref("/internal/health")).toBe("/internal/health");
  });

  it("builds a support request mailto href with subject and body", () => {
    const href = buildSupportRequestMailtoHref("Pilot workspace");

    expect(href).toContain(`mailto:${ARCHLUCID_SUPPORT_EMAIL}`);
    expect(href).toContain("subject=");
    expect(href).toContain("body=");
    expect(decodeURIComponent(href)).toContain("Workspace: Pilot workspace");
  });

  it("maps bundle status to status tags", () => {
    expect(resolveSupportBundleStatusTag("ready", new Date("2026-07-07T12:00:00Z")).kind).toBe("ready");
    expect(resolveSupportBundleStatusTag("failed", null).kind).toBe("blocked");
    expect(resolveSupportBundleStatusTag("permission_required", null).kind).toBe("needs-attention");
  });

  it("exposes support email constant", () => {
    expect(ARCHLUCID_SUPPORT_EMAIL).toBe("support@archlucid.net");
  });
});
