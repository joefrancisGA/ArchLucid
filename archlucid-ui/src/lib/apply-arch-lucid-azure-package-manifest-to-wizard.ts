import type { ArchLucidAzurePackageManifest } from "@/lib/arch-lucid-azure-package-manifest";
import type { WizardFormValues } from "@/lib/wizard-schema";

/** Extractor scope is not a stored system name — leave identity for the operator on the review step. */
export function suggestSystemNameFromArchLucidAzureManifest(_manifest: ArchLucidAzurePackageManifest): string {
  return "";
}

/**
 * Maps packager manifest onto wizard fields consumed by the create-run payload mapper
 * (description, optional system rename, topology hints for scope context).
 */
export function buildWizardPrefillFromArchLucidAzureManifest(
  manifest: ArchLucidAzurePackageManifest,
): Partial<Pick<WizardFormValues, "description" | "systemName" | "topologyHints">> {
  const description: string =
    `Azure extractor baseline package (schema v${String(manifest.schemaVersion)}). ` +
    `Subscription: ${manifest.subscriptionId}. ` +
    `Scope: ${manifest.scope}. ` +
    `Collected (UTC): ${manifest.collectionTimestamp}. ` +
    `Confirm or edit this brief before starting the architecture review.`;

  const topologyHints: string[] = [
    `Azure subscription ${manifest.subscriptionId}`,
    `Extractor scope ${manifest.scope}`,
    `Packager script v${manifest.scriptVersion}`,
  ];

  const out: Partial<Pick<WizardFormValues, "description" | "systemName" | "topologyHints">> = {
    description,
    topologyHints,
  };

  const suggested = suggestSystemNameFromArchLucidAzureManifest(manifest);

  if (suggested.length >= 2) {
    out.systemName = suggested;
  }

  return out;
}
