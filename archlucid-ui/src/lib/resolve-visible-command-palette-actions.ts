import { ARCHITECTURES_NEW_PATH } from "@/lib/architecture/architecture-routes";
import { WORKING_NEW_REVIEW_LABEL } from "@/lib/architecture/architecture-workflow-labels";
import {
  COMMAND_PALETTE_ACTIONS,
  type CommandPaletteHrefAction,
} from "@/lib/command-palette-actions";
import {
  COMMAND_PALETTE_HANDLER_ACTIONS,
  type CommandPaletteHandlerAction,
  type CommandPaletteHandlerAvailabilityContext,
} from "@/lib/command-palette-handler-actions";
import { GOVERNANCE_AUDIT_PATH } from "@/lib/governance/governance-route-paths";
import { SPONSOR_REPORT_PATH } from "@/lib/sponsor-report-navigation";
import { WORKING_MODE_SECONDARY_REPORTING_HREFS } from "@/lib/workspace-mode/working-mode-nav-filter";

export type VisibleCommandPaletteAction = CommandPaletteHrefAction | CommandPaletteHandlerAction;

const WORKING_MODE_HIDDEN_ACTION_IDS = new Set(["action-finish-setup"]);

const WORKING_MODE_PALETTE_NAV_ALLOWLIST = new Set<string>([
  "/help",
  "/help/report-problem",
]);

export type ResolveVisibleCommandPaletteHrefActionsInput = {
  readonly workingMode: boolean;
  readonly hasCommittedArchitectureReview?: boolean;
  readonly showFullNav?: boolean;
  /** Working Start resolver output (IS-03); defaults to draft editor when omitted. */
  readonly workingStartHref?: string;
  /** Sidebar-visible href set — Working palette nav rows must agree (SD-11). */
  readonly visibleNavHrefs?: ReadonlySet<string>;
};

const GUIDED_FIRST_SESSION_HIDDEN_HREFS = new Set<string>([
  SPONSOR_REPORT_PATH,
  GOVERNANCE_AUDIT_PATH,
  "/insights/evidence-graph",
  "/insights/compare-two-reviews",
  "/insights/architecture-scorecard",
  "/insights/roi-summary",
]);

/** Working palette omits first-session setup rows; Guided/demo keep them (PT-06 / PT-10). */
export function resolveVisibleCommandPaletteHrefActions(
  input: ResolveVisibleCommandPaletteHrefActionsInput | boolean,
): readonly CommandPaletteHrefAction[] {
  const workingMode = typeof input === "boolean" ? input : input.workingMode;
  const hasCommittedArchitectureReview =
    typeof input === "boolean" ? true : input.hasCommittedArchitectureReview === true;
  const showFullNav = typeof input === "boolean" ? true : input.showFullNav === true;
  const workingStartHref =
    typeof input === "boolean" ? ARCHITECTURES_NEW_PATH : (input.workingStartHref ?? ARCHITECTURES_NEW_PATH);
  const visibleNavHrefs =
    typeof input === "boolean" ? undefined : input.visibleNavHrefs;

  let actions: readonly CommandPaletteHrefAction[] = workingMode
    ? COMMAND_PALETTE_ACTIONS.filter((action) => !WORKING_MODE_HIDDEN_ACTION_IDS.has(action.id)).map((action) =>
        action.id === "action-create-review"
          ? {
              ...action,
              label: WORKING_NEW_REVIEW_LABEL,
              href: workingStartHref,
              searchValue: "action new work resume draft editor start",
            }
          : action,
      )
    : COMMAND_PALETTE_ACTIONS;

  if (!workingMode && !hasCommittedArchitectureReview && !showFullNav) {
    actions = actions.filter((action) => !GUIDED_FIRST_SESSION_HIDDEN_HREFS.has(action.href));
  }

  if (workingMode) {
    actions = actions.filter((action) => {
      if (WORKING_MODE_SECONDARY_REPORTING_HREFS.has(action.href)) {
        return false;
      }

      if (visibleNavHrefs === undefined) {
        return true;
      }

      if (WORKING_MODE_PALETTE_NAV_ALLOWLIST.has(action.href)) {
        return true;
      }

      return visibleNavHrefs.has(action.href);
    });
  }

  return actions;
}

export function resolveVisibleCommandPaletteHandlerActions(
  pathname: string,
  context?: CommandPaletteHandlerAvailabilityContext,
): readonly CommandPaletteHandlerAction[] {
  return COMMAND_PALETTE_HANDLER_ACTIONS.filter((action) => action.isAvailable(pathname, context));
}
