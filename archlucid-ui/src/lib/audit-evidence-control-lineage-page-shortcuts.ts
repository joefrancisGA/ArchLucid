import type { PageShortcutEntry } from "@/lib/shortcut-registry";

import {
  AUDIT_EVIDENCE_CONTROL_LINEAGE_CHAIN_TOGGLE_SHORTCUT,
  AUDIT_EVIDENCE_CONTROL_LINEAGE_COPY_LINK_SHORTCUT,
  AUDIT_EVIDENCE_CONTROL_LINEAGE_PACKAGE_DOWNLOAD_SHORTCUT,
} from "@/lib/audit-evidence-page-copy";

/** Control lineage detail (COO) — page-scoped Alt shortcuts documented in the keyboard affordance strip. */
export const AUDIT_EVIDENCE_CONTROL_LINEAGE_PAGE_SHORTCUTS: readonly PageShortcutEntry[] = [
  {
    key: "alt+1",
    label: AUDIT_EVIDENCE_CONTROL_LINEAGE_CHAIN_TOGGLE_SHORTCUT,
    description: "Toggle the chain-of-custody spine on the control lineage page",
  },
  {
    key: "alt+2",
    label: AUDIT_EVIDENCE_CONTROL_LINEAGE_COPY_LINK_SHORTCUT,
    description: "Copy the current control lineage URL to the clipboard",
  },
  {
    key: "alt+3",
    label: AUDIT_EVIDENCE_CONTROL_LINEAGE_PACKAGE_DOWNLOAD_SHORTCUT,
    description: "Download the snapshot evidence bundle (ZIP) for this assessment snapshot",
  },
];
