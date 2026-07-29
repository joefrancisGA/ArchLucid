import { describe, expect, it } from "vitest";

import { AUTHORITY_RANK } from "@/lib/nav-authority";
import { operatorNavOutsideProviderPrincipal, shellBootstrapReadPrincipal } from "@/lib/current-principal";
import {
  callerCanAccessHelpTopic,
  isInternalRunbookHelpSlug,
  principalCanAccessHelpTopic,
} from "@/lib/product-documentation-access";
import { getProductDocumentationEntry } from "@/lib/product-documentation-registry";

describe("product-documentation-access", () => {
  it("treats internal-runbook slugs as admin-only", () => {
    expect(isInternalRunbookHelpSlug("first-value-20-minutes")).toBe(true);
    expect(isInternalRunbookHelpSlug("developer-troubleshooting")).toBe(true);
    expect(isInternalRunbookHelpSlug("review-guide")).toBe(false);
    expect(isInternalRunbookHelpSlug("pre-commit-ci-gate")).toBe(false);
  });

  it("denies internal-runbook topics for read-tier callers", () => {
    const entry = getProductDocumentationEntry("first-value-20-minutes");

    expect(entry).not.toBeNull();
    expect(callerCanAccessHelpTopic(entry!, AUTHORITY_RANK.ReadAuthority)).toBe(false);
    expect(callerCanAccessHelpTopic(entry!, AUTHORITY_RANK.ExecuteAuthority)).toBe(false);
    expect(callerCanAccessHelpTopic(entry!, AUTHORITY_RANK.AdminAuthority)).toBe(true);
  });

  it("gates engineering troubleshooting as Admin-only (TB-1246)", () => {
    const entry = getProductDocumentationEntry("developer-troubleshooting");

    expect(entry).not.toBeNull();
    expect(entry!.contentKind).toBe("internal-runbook");
    expect(callerCanAccessHelpTopic(entry!, AUTHORITY_RANK.ReadAuthority)).toBe(false);
    expect(callerCanAccessHelpTopic(entry!, AUTHORITY_RANK.ExecuteAuthority)).toBe(false);
    expect(callerCanAccessHelpTopic(entry!, AUTHORITY_RANK.AdminAuthority)).toBe(true);
    expect(principalCanAccessHelpTopic(entry!, shellBootstrapReadPrincipal)).toBe(false);
    expect(principalCanAccessHelpTopic(entry!, operatorNavOutsideProviderPrincipal)).toBe(true);
  });

  it("allows product-help topics for read-tier callers", () => {
    const entry = getProductDocumentationEntry("review-guide");

    expect(entry).not.toBeNull();
    expect(callerCanAccessHelpTopic(entry!, AUTHORITY_RANK.ReadAuthority)).toBe(true);
  });

  it("maps principal read-model to help access", () => {
    const entry = getProductDocumentationEntry("first-value-20-minutes");

    expect(entry).not.toBeNull();
    expect(principalCanAccessHelpTopic(entry!, shellBootstrapReadPrincipal)).toBe(false);
    expect(principalCanAccessHelpTopic(entry!, operatorNavOutsideProviderPrincipal)).toBe(true);
  });
});
