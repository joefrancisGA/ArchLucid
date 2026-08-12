/**
 * Canonical keyboard shortcuts for the operator shell.
 *
 * **Why Alt (not Ctrl/Cmd)?** Ctrl/Cmd collide with browser chrome (new tab/window, copy, etc.).
 * Alt+letter is rarely bound in the page content area on Chrome/Edge/Firefox, which suits an
 * internal operator UI. See also `useKeyboardShortcuts.ts`.
 */
import { COMPARE_TWO_REVIEWS_PATH } from "@/lib/compare-two-reviews-route";
import { OPERATOR_NAV_LINK_LABELS } from "@/lib/i18n";
import { BUYER_NEW_REVIEW_NAV_LABEL, OPERATOR_START_REVIEW_QUICK_ACTION_LABEL } from "@/lib/operator/operator-nav-labels";

export type ShortcutEntry = {
  key: string;
  label: string;
  description: string;
  route?: string;
};

export const SHORTCUTS: ShortcutEntry[] = [
  {
    key: "alt+n",
    label: BUYER_NEW_REVIEW_NAV_LABEL,
    route: "/architecture/reviews/new",
    description: `${OPERATOR_START_REVIEW_QUICK_ACTION_LABEL} — open the new-review wizard`,
  },
  {
    key: "alt+r",
    label: "Reviews",
    route: "/architecture/reviews",
    description: "Open reviews list",
  },
  {
    key: "alt+c",
    label: "Compare",
    route: COMPARE_TWO_REVIEWS_PATH,
    description: "Compare two reviews",
  },
  {
    key: "alt+p",
    label: "Validate",
    route: "/internal/replay",
    description: "Validate review",
  },
  {
    key: "alt+a",
    label: "Ask review questions",
    route: "/insights/ask-review-questions",
    description: "Open Ask (scoped Q&A)",
  },
  {
    key: "alt+g",
    label: "Findings",
    route: "/governance/findings",
    description: "Open architecture risk register",
  },
  {
    key: "alt+y",
    label: "Graph",
    route: "/insights/evidence-graph",
    description: "Open graph",
  },
  {
    key: "alt+l",
    label: "Alerts",
    route: "/governance/alerts",
    description: "Open alerts",
  },
  {
    key: "alt+h",
    label: OPERATOR_NAV_LINK_LABELS.home,
    route: "/",
    description: "Open workspace home",
  },
  {
    key: "shift+?",
    label: "Documentation search",
    description: "Open curated documentation search (Shift+/)",
  },
  {
    key: "f1",
    label: "Help",
    description: "Open help and documentation (F1)",
  },
];

/**
 * Maps a registry combo string to the `aria-keyshortcuts` / tooltip form (e.g. `alt+n` → `Alt+N`).
 * Keeps SidebarNav and other hints aligned with `SHORTCUTS[].key`.
 */
export function registryKeyToAriaKeyShortcuts(combo: string): string {
  const parts = combo
    .split("+")
    .map((segment) => segment.trim())
    .filter((segment) => segment.length > 0);

  return parts
    .map((part) => {
      const lower = part.toLowerCase();

      if (lower === "?") {
        return "?";
      }

      if (lower.length === 1 && /^[a-z0-9]$/i.test(lower)) {
        return lower.toUpperCase();
      }

      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join("+");
}

function normalizeCombo(combo: string): string {
  return combo.toLowerCase().trim();
}

export function findShortcutByKey(combo: string): ShortcutEntry | undefined {
  const needle = normalizeCombo(combo);

  return SHORTCUTS.find((entry) => normalizeCombo(entry.key) === needle);
}

/**
 * Page-scoped shortcuts (documented in the global help dialog). These do not use `route`; they apply only
 * in context (e.g. when an alert card has focus on `/alerts`).
 */
export type PageShortcutEntry = {
  key: string;
  label: string;
  description: string;
};

export const ALERTS_PAGE_SHORTCUTS: PageShortcutEntry[] = [
  {
    key: "alt+1",
    label: "Acknowledge",
    description:
      "Acknowledge the focused alert card on the Alerts page when Execute+ triage shortcuts are enabled in the shell",
  },
  {
    key: "alt+2",
    label: "Resolve",
    description:
      "Resolve the focused alert card on the Alerts page when Execute+ triage shortcuts are enabled in the shell",
  },
  {
    key: "alt+3",
    label: "Suppress",
    description:
      "Suppress the focused alert card on the Alerts page when Execute+ triage shortcuts are enabled in the shell",
  },
  {
    key: "alt+j",
    label: "Next alert",
    description: "Move focus to the next alert card (Alerts page)",
  },
  {
    key: "alt+k",
    label: "Previous alert",
    description: "Move focus to the previous alert card (Alerts page); stays on the first card",
  },
];

export const FINDINGS_PAGE_SHORTCUTS: PageShortcutEntry[] = [
  {
    key: "alt+1",
    label: "Accept finding",
    description:
      "Accept the focused finding on Findings queues when Execute+ triage shortcuts are enabled in the shell",
  },
  {
    key: "alt+2",
    label: "Remediate finding",
    description:
      "Mark the focused finding remediated on Findings queues when Execute+ triage shortcuts are enabled in the shell",
  },
  {
    key: "alt+3",
    label: "Reject finding N/A",
    description:
      "Reject the focused finding as not applicable on Findings queues when Execute+ triage shortcuts are enabled in the shell",
  },
  {
    key: "alt+j",
    label: "Next finding",
    description: "Move focus to the next finding card or row (Findings queues)",
  },
  {
    key: "alt+k",
    label: "Previous finding",
    description: "Move focus to the previous finding card or row (Findings queues); stays on the first",
  },
];

/**
 * Dispatched on `window` so the operator command palette can open from shell chrome that does not own palette state.
 * {@link CommandPalette} listens and calls `setOpen(true)`.
 */
export const OPEN_COMMAND_PALETTE_EVENT = "archlucid-open-command-palette";
