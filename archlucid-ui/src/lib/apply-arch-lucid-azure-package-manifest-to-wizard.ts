import type { ArchLucidAzurePackageManifest } from "@/lib/arch-lucid-azure-package-manifest";
import type { WizardFormValues } from "@/lib/wizard-schema";

export function suggestSystemNameFromArchLucidAzureManifest(manifest: ArchLucidAzurePackageManifest): string {
  const scope = manifest.scope.trim();
  const rgMatch = /\/resourceGroups\/([^/]+)\s*$/i.exec(scope);

  if (rgMatch !== null) {
    const raw = rgMatch[1];
    const slug = raw.replace(/[^a-zA-Z0-9]/g, "");

    if (slug.length >= 2) {
      return slug.slice(0, 64);
    }
  }

  const sub = manifest.subscriptionId.replace(/-/g, "");

  if (sub.length >= 8) {
    return `Azure${sub.slice(0, 8)}`;
  }

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

  const suggested = suggestSystemNameFromArchLucidAzureManifest(manifest);

  const topologyHints: string[] = [
    `Azure subscription ${manifest.subscriptionId}`,
    `Extractor scope ${manifest.scope}`,
    `Packager script v${manifest.scriptVersion}`,
  ];

  const out: Partial<Pick<WizardFormValues, "description" | "systemName" | "topologyHints">> = {
    description,
    topologyHints,
  };

  if (suggested.length >= 2) {
    out.systemName = suggested;
  }

  return out;
}
