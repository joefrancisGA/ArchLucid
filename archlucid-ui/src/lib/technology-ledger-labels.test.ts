import { describe, expect, it } from "vitest";

import {
  TECHNOLOGY_LEDGER_CHOSEN_NONE_STATUS_LABEL,
  TECHNOLOGY_LEDGER_PROVIDER_NOT_CHOSEN_LABEL,
  technologyLedgerProviderDisplayLabel,
  technologyLedgerStatusDisplayTag,
} from "@/lib/technology-ledger-labels";
import type { TechnologyLedgerEntry } from "@/types/technology-ledger";

function entry(
  overrides: Partial<TechnologyLedgerEntry> & Pick<TechnologyLedgerEntry, "entryId" | "role" | "status" | "providerFamily">,
): TechnologyLedgerEntry {
  return {
    entryId: overrides.entryId,
    role: overrides.role,
    status: overrides.status,
    providerFamily: overrides.providerFamily,
    technologyName: overrides.technologyName ?? "Tech",
    source: overrides.source ?? "User",
    isLocked: overrides.isLocked ?? false,
    evidenceRef: overrides.evidenceRef ?? null,
  };
}

describe("technology-ledger-labels", () => {
  it("does not present Chosen None as an authoritative provider choice", () => {
    const row = entry({
      entryId: "e1",
      role: "CloudPlatform",
      status: "Chosen",
      providerFamily: "None",
    });

    expect(technologyLedgerProviderDisplayLabel(row)).toBe(TECHNOLOGY_LEDGER_PROVIDER_NOT_CHOSEN_LABEL);
    expect(technologyLedgerStatusDisplayTag(row).label).toBe(TECHNOLOGY_LEDGER_CHOSEN_NONE_STATUS_LABEL);
  });
});
