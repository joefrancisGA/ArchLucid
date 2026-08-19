import { describe, expect, it } from "vitest";

import { ARCHITECTURE_CREATION_BOOTSTRAP_INTENT } from "@/lib/architecture/architecture-creation-bootstrap";

import {
  architectureDraftCustomerStatusTagKind,
  architectureDraftDisplayName,
  architectureDraftPlaceholderTitle,
  customerFacingArchitectureDraftTitle,
  LEGACY_UNTITLED_ARCHITECTURE_LABEL,
  resolveArchitectureDraftCustomerStatus,
  stripLeadingMarkdownHeading,
  UNTITLED_ARCHITECTURE_LABEL,
} from "@/lib/architecture/architecture-draft-status";

describe("architectureDraftDisplayName", () => {
  it("prefers a non-empty system name", () => {
    expect(architectureDraftDisplayName("Claims intake", ARCHITECTURE_CREATION_BOOTSTRAP_INTENT)).toBe(
      "Claims intake",
    );
  });

  it("never surfaces the bootstrap intent marker", () => {
    expect(architectureDraftDisplayName(undefined, ARCHITECTURE_CREATION_BOOTSTRAP_INTENT)).toBe(
      UNTITLED_ARCHITECTURE_LABEL,
    );
    expect(architectureDraftDisplayName("", ARCHITECTURE_CREATION_BOOTSTRAP_INTENT)).toBe(
      UNTITLED_ARCHITECTURE_LABEL,
    );
  });

  it("uses a truncated free-text intent when the draft has a meaningful name", () => {
    const longIntent = "A".repeat(80);

    expect(architectureDraftDisplayName(undefined, longIntent)).toBe(`${"A".repeat(61)}…`);
  });

  it("strips a leading markdown heading from intent used as the title", () => {
    expect(
      architectureDraftDisplayName(
        undefined,
        "# Architecture Review Packet: B2B SaaS Tenant Migration Platform",
      ),
    ).toBe("Architecture Review Packet: B2B SaaS Tenant Migration Platform");
  });

  it("falls back to Untitled architecture when intent is empty", () => {
    expect(architectureDraftDisplayName(undefined, "   ")).toBe(UNTITLED_ARCHITECTURE_LABEL);
  });
});

describe("customerFacingArchitectureDraftTitle", () => {
  it("replaces stored bootstrap marker titles with the untitled placeholder", () => {
    const leaked = `${ARCHITECTURE_CREATION_BOOTSTRAP_INTENT.slice(0, 61)}…`;
    const referenceUtc = "2026-07-12T23:42:05.000Z";

    expect(customerFacingArchitectureDraftTitle(leaked, referenceUtc)).toBe(UNTITLED_ARCHITECTURE_LABEL);
    expect(customerFacingArchitectureDraftTitle(ARCHITECTURE_CREATION_BOOTSTRAP_INTENT, referenceUtc)).toBe(
      UNTITLED_ARCHITECTURE_LABEL,
    );
  });

  it("normalizes legacy Architecture draft labels and dated placeholders", () => {
    const referenceUtc = "2026-07-12T23:42:05.000Z";

    expect(customerFacingArchitectureDraftTitle(LEGACY_UNTITLED_ARCHITECTURE_LABEL, referenceUtc)).toBe(
      UNTITLED_ARCHITECTURE_LABEL,
    );
    expect(
      customerFacingArchitectureDraftTitle(`${LEGACY_UNTITLED_ARCHITECTURE_LABEL} · Created Jul 12, 2026`),
    ).toBe(UNTITLED_ARCHITECTURE_LABEL);
  });

  it("strips leading markdown headings from stored titles", () => {
    expect(customerFacingArchitectureDraftTitle("# Healthcare Claims Platform")).toBe(
      "Healthcare Claims Platform",
    );
  });

  it("keeps meaningful stored titles", () => {
    expect(customerFacingArchitectureDraftTitle("Payments platform")).toBe("Payments platform");
  });
});

describe("stripLeadingMarkdownHeading", () => {
  it("removes ATX heading markers", () => {
    expect(stripLeadingMarkdownHeading("## Foo")).toBe("Foo");
    expect(stripLeadingMarkdownHeading("Foo")).toBe("Foo");
  });
});

describe("resolveArchitectureDraftCustomerStatus", () => {
  it("returns ready-for-review when a linked review exists", () => {
    expect(
      resolveArchitectureDraftCustomerStatus({
        linkedReviewId: "run-001",
        reviewReadinessValid: false,
      }),
    ).toBe("ready-for-review");
  });

  it("returns ready-for-review when fields pass review readiness without a linked review", () => {
    expect(
      resolveArchitectureDraftCustomerStatus({
        linkedReviewId: null,
        reviewReadinessValid: true,
      }),
    ).toBe("ready-for-review");
  });

  it("returns draft when no linked review and readiness is incomplete", () => {
    expect(
      resolveArchitectureDraftCustomerStatus({
        linkedReviewId: null,
        reviewReadinessValid: false,
      }),
    ).toBe("draft");
  });
});

describe("architectureDraftCustomerStatusTagKind", () => {
  it("maps draft to gray draft, ready-for-review to blue in-progress, archived to neutral", () => {
    expect(architectureDraftCustomerStatusTagKind("draft")).toBe("draft");
    expect(architectureDraftCustomerStatusTagKind("ready-for-review")).toBe("in-progress");
    expect(architectureDraftCustomerStatusTagKind("archived")).toBe("neutral");
  });
});

describe("architectureDraftPlaceholderTitle", () => {
  it("uses a date-free untitled label so created dates stay in metadata", () => {
    expect(architectureDraftPlaceholderTitle("2026-07-12T23:42:05.000Z")).toBe(UNTITLED_ARCHITECTURE_LABEL);
    expect(architectureDraftPlaceholderTitle(null)).toBe(UNTITLED_ARCHITECTURE_LABEL);
    expect(architectureDraftPlaceholderTitle("not-a-date")).toBe(UNTITLED_ARCHITECTURE_LABEL);
  });
});
