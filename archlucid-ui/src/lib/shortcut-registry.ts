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

import { ARCHITECTURES_NEW_PATH, REVIEWS_NEW_PATH } from "@/lib/architecture/architecture-routes";

export const WORKING_MODE_NEW_REVIEW_ROUTE = ARCHITECTURES_NEW_PATH;

/** Shift+? / help overlay — Guided mode may still say wizard; Working uses draft editor (LI-06). */
export const GUIDED_ALT_N_SHORTCUT_DESCRIPTION = `${OPERATOR_START_REVIEW_QUICK_ACTION_LABEL} — open the guided new-review wizard`;

export const WORKING_ALT_N_SHORTCUT_DESCRIPTION = `${OPERATOR_START_REVIEW_QUICK_ACTION_LABEL} — resume in-flight review, last architecture, or new architecture`;

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
    route: ARCHITECTURES_NEW_PATH,
    description: WORKING_ALT_N_SHORTCUT_DESCRIPTION,
  },
  {
    key: "alt+r",
    label: OPERATOR_NAV_LINK_LABELS.packages,
    route: "/architecture/reviews",
    description: "Open packages list",
  },
  {
    key: "alt+c",
    label: "Compare",
    route: COMPARE_TWO_REVIEWS_PATH,
    description: "Compare two reviews",
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
    label: "Find help (Ctrl+K)",
    description: "Open documentation search (Shift+/) — use Ctrl+K command palette to find any page",
  },
  {
    key: "f1",
    label: "Page help",
    description: "Open contextual help for the current page (F1)",
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

/** Help overlay and keyboard map descriptions — Working Alt+N is the draft editor, not the wizard. */
export function resolveShortcutDescription(
  entry: ShortcutEntry,
  workingMode: boolean,
  onReviewPage = false,
): string {
  if (normalizeCombo(entry.key) === "alt+n") {
    return workingMode ? WORKING_ALT_N_SHORTCUT_DESCRIPTION : GUIDED_ALT_N_SHORTCUT_DESCRIPTION;
  }

  if (normalizeCombo(entry.key) === "alt+c" && workingMode) {
    return onReviewPage
      ? "Compare two reviews — uses this review as the base run"
      : "Compare two reviews — on a review page, uses that review as the base run";
  }

  if (normalizeCombo(entry.key) === "alt+a" && workingMode && onReviewPage) {
    return "Ask review questions — scoped to this review";
  }

  if (normalizeCombo(entry.key) === "alt+y" && workingMode && onReviewPage) {
    return "Open evidence graph — scoped to this review";
  }

  return entry.description;
}

/** Guided palette and legacy bookmarks still target the wizard hub route. */
export const GUIDED_NEW_REVIEW_ROUTE = REVIEWS_NEW_PATH;

/**
 * Page-scoped shortcuts (documented in the global help dialog). These do not use `route`; they apply only
 * in context (e.g. when an alert card has focus on `/alerts`).
 */
export type PageShortcutEntry = {
  key: string;
  label: string;
  description: string;
};

/**
 * Shell chrome shortcuts that open a surface instead of navigating to a route.
 *
 * Deliberately **not** in {@link SHORTCUTS}: `useShortcutNavigation` binds that list, and
 * {@link CommandPalette} already owns its own Ctrl/Cmd+K listener — a second binding would toggle
 * the dialog twice per keypress. This list exists so the Help → Shortcuts tab can document the
 * palette, which was previously discoverable only by hovering the header search input.
 */
export const SHELL_COMMAND_SHORTCUTS: PageShortcutEntry[] = [
  {
    key: "ctrl+k",
    label: "Command palette",
    description:
      "Open the command palette to jump to any page, review, or task, including save changes, finalize review, compare-this-review, and finding / alert work actions when those surfaces are open (Cmd+K on Mac; works while the header search box has focus)",
  },
];

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

/** Architecture desk work actions — documented first in Working Shift+? overlay (AO-43). */
export const ARCHITECTURE_DESK_PAGE_SHORTCUTS: PageShortcutEntry[] = [
  {
    key: "alt+n",
    label: "Start or resume",
    description: WORKING_ALT_N_SHORTCUT_DESCRIPTION,
  },
  {
    key: "ctrl+shift+s",
    label: "Save architecture draft",
    description:
      "Save the architecture draft from the desk when the draft editor pane is open on the architecture identity page",
  },
];

export const REVIEW_DETAIL_PAGE_SHORTCUTS: PageShortcutEntry[] = [
  {
    key: "alt+c",
    label: "Compare this review",
    description:
      "In Working mode on a review page, opens Compare with this review as the base run (unscoped elsewhere)",
  },
  {
    key: "ctrl+shift+s",
    label: "Save architecture draft",
    description: "Save the architecture draft from the review workbench when a draft editor is open",
  },
  {
    key: "alt+m",
    label: "Toggle room elicitation",
    description:
      "Start or stop room elicitation on a completed review without entering projector presenter mode",
  },
];

/**
 * Dispatched on `window` so the operator command palette can open from shell chrome that does not own palette state.
 * {@link CommandPalette} listens and calls `setOpen(true)`.
 */
export const OPEN_COMMAND_PALETTE_EVENT = "archlucid-open-command-palette";

export type OpenCommandPaletteEventDetail = {
  readonly initialQuery?: string;
};

/** Open the command palette from header search or other shell chrome, optionally seeding the query. */
export function dispatchOpenCommandPalette(initialQuery?: string): void {
  const trimmed = initialQuery?.trim() ?? "";
  const detail: OpenCommandPaletteEventDetail =
    trimmed.length > 0 ? { initialQuery: trimmed } : {};

  window.dispatchEvent(new CustomEvent<OpenCommandPaletteEventDetail>(OPEN_COMMAND_PALETTE_EVENT, { detail }));
}
