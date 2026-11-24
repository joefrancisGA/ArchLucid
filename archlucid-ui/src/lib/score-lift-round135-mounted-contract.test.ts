import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

function readUiSource(relativePath: string): string {
  return readFileSync(join(dirname(fileURLToPath(import.meta.url)), "..", relativePath), "utf8");
}

describe("score-lift round135 mounted contract", () => {
  it("accelerator round 135 surfaces", () => {
    const help = readUiSource("app/(operator)/help/_sections/HelpSpecialtyWalkthroughTemplatesClient.tsx");
    const preview = readUiSource("app/(operator)/help/_sections/SpecialtyTemplatePreviewDialog.tsx");
    const golden = readUiSource("components/golden-walkthrough/GoldenSponsorPackageWalkthroughPanel.tsx");
    const factory = readUiSource("app/(operator)/governance/remediation-factory/RemediationFactoryClient.tsx");
    const firstHour = readUiSource("app/(operator)/administration/securenow-first-hour/SecureNowFirstHourPageView.tsx");
    const pilotDecision = readUiSource("app/(operator)/administration/securenow-pilot-decision/SecureNowPilotDecisionPageView.tsx");

    expect(help).toContain("SpecialtyTemplateAuthorityLoadFailurePanel");
    const authorityPanel = readUiSource("components/help/SpecialtyTemplateAuthorityLoadFailurePanel.tsx");
    expect(authorityPanel).toContain('data-testid="specialty-template-authority-load-failure"');
    expect(help).toContain("help-specialty-walkthroughs-partial-capture");
    expect(help).toContain("!authorityLoadFailure");

    expect(preview).toContain('data-testid="specialty-template-preview-fixture-line"');
    expect(golden).toContain("buildGoldenSponsorPackageWalkthroughStepHref");
    expect(golden).toContain("GoldenSponsorPackageWalkthroughPartialCaptureStrip");
    expect(factory).toContain("RemediationFactoryRankedPathsEmptyAcceleratorHandoff");
    expect(firstHour).toContain("SecureNowPilotSpineAcceleratorIndex");
    expect(pilotDecision).toContain("SecureNowPilotSpineAcceleratorIndex");
  });
});
