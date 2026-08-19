import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import ComplianceJourneyPage from "@/app/(marketing)/compliance-journey/page";
import {
  COMPLIANCE_JOURNEY_DILIGENCE_SECTIONS,
  COMPLIANCE_JOURNEY_TRUST_PUBLIC_DOWNLOADS_HREF,
  complianceJourneyLinkAccessibleName,
} from "@/lib/compliance-journey-diligence-links";
import { TRUST_CENTER_EVIDENCE_PACK_ZIP_HREF } from "@/lib/trust-center-public-assurance";

const appRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "app", "(marketing)", "compliance-journey");

describe("compliance-journey-diligence-links (TB-1486)", () => {
  it("prefers Trust Center downloads for questionnaire pre-fills", () => {
    const questionnaireSection = COMPLIANCE_JOURNEY_DILIGENCE_SECTIONS.find(
      (section) => section.id === "questionnaires",
    );

    expect(questionnaireSection).toBeDefined();

    const trustDownload = questionnaireSection?.links.find((link) => link.id === "caiq-sig-trust");

    expect(trustDownload?.href).toBe(COMPLIANCE_JOURNEY_TRUST_PUBLIC_DOWNLOADS_HREF);
    expect(trustDownload?.destination).toBe("trust-center-download");
  });

  it("labels every diligence link with a destination type", () => {
    const links = COMPLIANCE_JOURNEY_DILIGENCE_SECTIONS.flatMap((section) => section.links);

    expect(links.length).toBeGreaterThan(0);

    for (const link of links) {
      expect(complianceJourneyLinkAccessibleName(link)).toMatch(/\(.+\)$/);
    }
  });

  it("routes procurement ZIP to the anonymous Trust Center download endpoint", () => {
    const links = COMPLIANCE_JOURNEY_DILIGENCE_SECTIONS.flatMap((section) => section.links);
    const zipLink = links.find((link) => link.id === "evidence-pack-zip");

    expect(zipLink?.href).toBe(TRUST_CENTER_EVIDENCE_PACK_ZIP_HREF);
  });
});

describe("ComplianceJourneyPage doc-link honesty (TB-1486)", () => {
  it("does not imply SOC 2 attestation and exposes destination-labeled links", () => {
    render(<ComplianceJourneyPage />);

    expect(screen.getByText(/not SOC 2 attested/i)).toBeInTheDocument();
    expect(screen.queryByText(/is SOC 2 attested today/i)).not.toBeInTheDocument();

    expect(
      screen.getByRole("link", {
        name: /CAIQ Lite and SIG Core \(in evidence pack\) \(Trust Center download\)/i,
      }),
    ).toHaveAttribute("href", COMPLIANCE_JOURNEY_TRUST_PUBLIC_DOWNLOADS_HREF);

    expect(
      screen.getByRole("link", {
        name: /CAIQ \/ SIG questionnaire pre-fill drafts \(in-product help\)/i,
      }),
    ).toHaveAttribute("href", "/help/caiq-sig-response");

    expect(
      screen.getByRole("link", {
        name: /DPA template \(template in product help\)/i,
      }),
    ).toHaveAttribute("href", "/help/dpa-template");
  });

  it("keeps diligence link definitions in the copy module, not inline in the page", () => {
    const source = readFileSync(join(appRoot, "page.tsx"), "utf8");

    expect(source).toContain("ComplianceJourneyPageBody");
    expect(source).not.toContain("resolveInAppDocHref");
  });
});
