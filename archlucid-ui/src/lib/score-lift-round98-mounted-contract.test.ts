import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

function readUiSource(relativePath: string): string {
  return readFileSync(join(dirname(fileURLToPath(import.meta.url)), "..", relativePath), "utf8");
}

describe("score-lift round98 mounted contract", () => {
  it("risk register empty, csv export, itsm create, oauth callback", () => {
    const outcome = readUiSource("app/(operator)/governance/findings/_sections/GovernanceFindingsQueueOutcomeSection.tsx");
    const filterBar = readUiSource("components/governance/findings/GovernanceFindingsFilterBar.tsx");
    const itsm = readUiSource("components/itsm/ItsmOutboundQuickActions.tsx");
    const oauth = readUiSource("app/(operator)/integrations/itsm/oauth/callback/ItsmAtlassianOAuthCallbackClient.tsx");

    expect(outcome).toContain('data-testid="governance-findings-risk-register-empty-not-load-failure"');
    expect(filterBar).toContain('data-testid="governance-findings-risk-register-csv-hard-failure"');
    expect(filterBar).toContain('data-testid="governance-findings-risk-register-csv-empty-not-failure"');
    expect(itsm).toContain('data-testid="itsm-create-connector-off-not-failed-create"');
    expect(itsm).toContain('data-testid="itsm-create-hard-failure-not-empty-linkage"');
    expect(itsm).toContain('data-testid="itsm-create-empty-linkage-not-failed-create"');
    expect(oauth).toContain('data-testid="itsm-oauth-operator-cancel-not-token-exchange"');
    expect(oauth).toContain('data-testid="itsm-oauth-token-exchange-failure-not-cancel"');
  });
});
