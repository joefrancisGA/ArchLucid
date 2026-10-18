import type { PageShortcutEntry as PageShortcutsDisclosureEntry } from "@/components/usability/PageShortcutsDisclosure";
import { REMEDIATION_FACTORY_PAGE_SHORTCUTS } from "@/lib/remediation-factory/remediation-factory-page-shortcuts";

export function remediationFactoryPageShortcutsDisclosureEntries(): readonly PageShortcutsDisclosureEntry[] {
  return REMEDIATION_FACTORY_PAGE_SHORTCUTS.map((entry) => ({
    id: entry.key.replaceAll("+", "-"),
    label: `${entry.key} — ${entry.label}`,
    description: entry.description,
  }));
}
