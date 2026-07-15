import type { EmptyStateProps } from "@/components/EmptyState";
import type { EnterpriseCompactEmptyStateProps } from "@/components/EnterpriseCompactEmptyState";
import * as emptyStatePresets from "@/lib/empty-state-presets";
import * as enterpriseCompactEmptyStatePresets from "@/lib/enterprise-compact-empty-state-presets";
import { hrefTargetsPermanentRedirectSource } from "@/lib/next-config-permanent-redirect-source-paths";

function collectEmptyStateHrefs(preset: EmptyStateProps): string[] {
  const hrefs: string[] = [];

  for (const action of preset.actions ?? []) {
    hrefs.push(action.href);
  }

  if (preset.secondaryAction !== undefined) {
    hrefs.push(preset.secondaryAction.href);
  }

  return hrefs;
}

function collectCompactEmptyStateHrefs(preset: EnterpriseCompactEmptyStateProps): string[] {
  return (preset.actions ?? []).map((action) => action.href);
}

export function collectEmptyStatePresetCtaHrefs(): Array<{ presetName: string; href: string }> {
  const entries: Array<{ presetName: string; href: string }> = [];

  for (const [presetName, value] of Object.entries(emptyStatePresets)) {
    if (typeof value !== "object" || value === null || !("title" in value)) {
      continue;
    }

    const preset = value as EmptyStateProps;

    for (const href of collectEmptyStateHrefs(preset)) {
      entries.push({ presetName, href });
    }
  }

  return entries;
}

export function collectEnterpriseCompactEmptyStatePresetCtaHrefs(): Array<{ presetName: string; href: string }> {
  const entries: Array<{ presetName: string; href: string }> = [];

  for (const [presetName, value] of Object.entries(enterpriseCompactEmptyStatePresets)) {
    if (!presetName.endsWith("_COMPACT") || typeof value !== "object" || value === null) {
      continue;
    }

    const preset = value as EnterpriseCompactEmptyStateProps;

    for (const href of collectCompactEmptyStateHrefs(preset)) {
      entries.push({ presetName, href });
    }
  }

  return entries;
}

export function findPresetCtasTargetingRedirectSources(): Array<{
  module: "empty-state" | "enterprise-compact";
  presetName: string;
  href: string;
}> {
  const violations: Array<{
    module: "empty-state" | "enterprise-compact";
    presetName: string;
    href: string;
  }> = [];

  for (const { presetName, href } of collectEmptyStatePresetCtaHrefs()) {
    if (hrefTargetsPermanentRedirectSource(href)) {
      violations.push({ module: "empty-state", presetName, href });
    }
  }

  for (const { presetName, href } of collectEnterpriseCompactEmptyStatePresetCtaHrefs()) {
    if (hrefTargetsPermanentRedirectSource(href)) {
      violations.push({ module: "enterprise-compact", presetName, href });
    }
  }

  return violations;
}
