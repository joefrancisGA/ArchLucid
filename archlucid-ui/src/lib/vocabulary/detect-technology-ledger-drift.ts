import { technologyLedgerRoleLabel } from "@/lib/technology-ledger-labels";
import type { CloudProviderFamily, TechnologyLedgerEntry, TechnologyLedgerRole } from "@/types/technology-ledger";

export type TechnologyLedgerDriftCode = "duplicate-chosen-provider" | "assumed-chosen-conflict";

export type TechnologyLedgerDriftWarning = {
  readonly code: TechnologyLedgerDriftCode;
  readonly role: TechnologyLedgerRole;
  readonly message: string;
};

function uniqueProviderFamilies(entries: readonly TechnologyLedgerEntry[]): CloudProviderFamily[] {
  const providers = new Set<CloudProviderFamily>();

  for (const entry of entries) {
    providers.add(entry.providerFamily);
  }

  return [...providers];
}

function formatRoleLabel(role: TechnologyLedgerRole): string {
  return technologyLedgerRoleLabel(role);
}

/** Client-side heuristic for conflicting technology ledger rows before finalize. */
export function detectTechnologyLedgerDrift(
  entries: readonly TechnologyLedgerEntry[],
): readonly TechnologyLedgerDriftWarning[] {
  const warnings: TechnologyLedgerDriftWarning[] = [];
  const byRole = new Map<TechnologyLedgerRole, TechnologyLedgerEntry[]>();

  for (const entry of entries) {
    const roleEntries = byRole.get(entry.role) ?? [];
    roleEntries.push(entry);
    byRole.set(entry.role, roleEntries);
  }

  for (const [role, roleEntries] of byRole.entries()) {
    const chosenEntries = roleEntries.filter((entry) => entry.status === "Chosen");
    const assumedEntries = roleEntries.filter((entry) => entry.status === "Assumed");
    const chosenProviders = uniqueProviderFamilies(chosenEntries);

    if (chosenProviders.length > 1) {
      warnings.push({
        code: "duplicate-chosen-provider",
        role,
        message: `${formatRoleLabel(role)} has multiple Chosen rows with different providers — pick one authoritative choice.`,
      });
    }

    if (chosenEntries.length === 0 || assumedEntries.length === 0) {
      continue;
    }

    const assumedProviders = uniqueProviderFamilies(assumedEntries);
    const chosenProvider = chosenProviders[0];

    if (chosenProvider === undefined) {
      continue;
    }

    const assumedConflicts = assumedProviders.some((provider) => provider !== chosenProvider);

    if (assumedConflicts) {
      warnings.push({
        code: "assumed-chosen-conflict",
        role,
        message: `${formatRoleLabel(role)} has Assumed proposals that conflict with the Chosen provider — approve or revise before finalize.`,
      });
    }
  }

  return warnings;
}
