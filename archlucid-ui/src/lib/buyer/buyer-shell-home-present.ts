import {
  BUYER_COMMAND_CENTER_HOLD_CTA_BASELINES,
  BUYER_COMMAND_CENTER_HOLD_CTA_BLOCKERS,
  BUYER_COMMAND_CENTER_HOLD_HEADLINE,
  BUYER_COMMAND_CENTER_HOLD_SUMMARY_BASELINES,
  BUYER_COMMAND_CENTER_HOLD_SUMMARY_BLOCKERS,
  BUYER_COMMAND_CENTER_HOLD_SUMMARY_PERMISSION,
  BUYER_COMMAND_CENTER_REVIEW_READY_SUMMARY,
  BUYER_CONFIG_EVIDENCE_UNAVAILABLE,
  BUYER_READINESS_UNAVAILABLE,
  BUYER_SPONSOR_DISPOSITION_DEFERRED,
  BUYER_SPONSOR_DISPOSITION_HOLD,
  BUYER_SPONSOR_DISPOSITION_READINESS,
  BUYER_SPONSOR_DISPOSITION_SEND,
  BUYER_STATUS_ACTION_NEEDED,
  BUYER_STATUS_BLOCKED,
  BUYER_STATUS_PENDING,
  BUYER_STATUS_READY,
} from "@/lib/buyer/buyer-home-status-copy";
import type { FirstPilotCommandCenterPhaseSummary, FirstPilotSponsorDisposition } from "@/lib/first-pilot-command-center-phase";
import type { FirstPilotReadinessStatus } from "@/lib/first-pilot-readiness-cockpit";
import {
  mapReadinessStatusToStatusTagLabel,
  mapSponsorDispositionToEnterpriseKind,
} from "@/lib/vocabulary/first-pilot-operator-status-vocabulary";
import {
  ENTERPRISE_STATUS_LABELS,
  enterpriseStatusTagClass,
  type EnterpriseStatusKind,
} from "@/lib/design-tokens";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { mapConfigLintReadiness, type ConfigLintReadinessCopy } from "@/lib/map-config-lint-readiness";

const STATUS_TAG_BASE =
  "inline-flex max-w-full items-center rounded-sm border px-2 py-0.5 text-xs font-medium leading-tight";

const BUYER_NEUTRAL_ATTENTION_TAG_CLASS = `${STATUS_TAG_BASE} border-neutral-300 bg-neutral-50 text-neutral-700 dark:border-neutral-600 dark:bg-neutral-900/60 dark:text-neutral-300`;

const BUYER_FILTER_CHIP_ACTIVE_CLASS =
  "border-neutral-500 bg-neutral-100 text-neutral-900 dark:border-neutral-500 dark:bg-neutral-800 dark:text-neutral-200";

const BUYER_FILTER_CHIP_IDLE_CLASS =
  "border-neutral-300 bg-neutral-100 text-neutral-700 hover:border-neutral-400 hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:border-neutral-600";

export function isBuyerShellHomePresentation(): boolean {
  return isBuyerPolishedOperatorShellEnv();
}

export function shellEnterpriseStatusLabel(kind: EnterpriseStatusKind): string {
  if (!isBuyerShellHomePresentation()) {
    return ENTERPRISE_STATUS_LABELS[kind];
  }

  switch (kind) {
    case "ready":
    case "approved":
      return BUYER_STATUS_READY;

    case "needs-attention":
    case "approved-with-monitoring":
      return BUYER_STATUS_ACTION_NEEDED;

    case "blocked":
      return BUYER_STATUS_BLOCKED;

    case "in-progress":
      return "In progress";

    case "draft":
      return BUYER_STATUS_PENDING;

    case "neutral":
    default:
      return BUYER_STATUS_PENDING;
  }
}

export function shellEnterpriseStatusTagClass(kind: EnterpriseStatusKind): string {
  if (!isBuyerShellHomePresentation()) {
    return enterpriseStatusTagClass(kind);
  }

  if (kind === "needs-attention") {
    return BUYER_NEUTRAL_ATTENTION_TAG_CLASS;
  }

  return enterpriseStatusTagClass(kind);
}

export function shellReadinessStatusTagLabel(status: FirstPilotReadinessStatus): string {
  if (!isBuyerShellHomePresentation()) {
    return mapReadinessStatusToStatusTagLabel(status);
  }

  switch (status) {
    case "ready":
      return BUYER_STATUS_READY;

    case "attention":
      return BUYER_STATUS_ACTION_NEEDED;

    case "blocked":
      return BUYER_STATUS_BLOCKED;

    case "unknown":
      return BUYER_STATUS_PENDING;

    default: {
      const exhaustive: never = status;

      return exhaustive;
    }
  }
}

export function shellReadinessCountPhrase(status: FirstPilotReadinessStatus, count: number): string {
  const label = shellReadinessStatusTagLabel(status).toLowerCase();

  return `${String(count)} ${label}`;
}

export function shellSponsorDispositionLabel(disposition: FirstPilotSponsorDisposition): string {
  if (!isBuyerShellHomePresentation()) {
    switch (disposition) {
      case "send":
        return BUYER_SPONSOR_DISPOSITION_SEND;

      case "hold":
        return "Business owner review needed";

      case "readiness-only":
        return BUYER_SPONSOR_DISPOSITION_READINESS;

      case "deferred":
        return BUYER_SPONSOR_DISPOSITION_DEFERRED;

      default: {
        const exhaustive: never = disposition;

        return exhaustive;
      }
    }
  }

  switch (disposition) {
    case "send":
      return BUYER_SPONSOR_DISPOSITION_SEND;

    case "hold":
      return BUYER_SPONSOR_DISPOSITION_HOLD;

    case "readiness-only":
      return BUYER_SPONSOR_DISPOSITION_READINESS;

    case "deferred":
      return BUYER_SPONSOR_DISPOSITION_DEFERRED;

    default: {
      const exhaustive: never = disposition;

      return exhaustive;
    }
  }
}

export function shellSponsorDispositionStatusKind(disposition: FirstPilotSponsorDisposition): EnterpriseStatusKind {
  return mapSponsorDispositionToEnterpriseKind(disposition);
}

export function applyBuyerPolishedCommandCenterPhase(
  phase: FirstPilotCommandCenterPhaseSummary,
  input: { baselinesEntered: boolean },
): FirstPilotCommandCenterPhaseSummary {
  if (!isBuyerShellHomePresentation()) {
    return phase;
  }

  if (phase.phase === "sponsor-packet-send" && input.baselinesEntered) {
    return {
      ...phase,
      headline: "Review ready",
      summary: BUYER_COMMAND_CENTER_REVIEW_READY_SUMMARY,
      cta: BUYER_COMMAND_CENTER_HOLD_CTA_BASELINES,
    };
  }

  if (phase.phase !== "sponsor-packet-hold") {
    return phase;
  }

  if (!input.baselinesEntered) {
    return {
      ...phase,
      headline: BUYER_COMMAND_CENTER_HOLD_HEADLINE,
      summary: BUYER_COMMAND_CENTER_HOLD_SUMMARY_BASELINES,
      cta: BUYER_COMMAND_CENTER_HOLD_CTA_BASELINES,
    };
  }

  if (phase.summary.includes("cannot complete sponsor handoff")) {
    return {
      ...phase,
      headline: BUYER_COMMAND_CENTER_HOLD_HEADLINE,
      summary: BUYER_COMMAND_CENTER_HOLD_SUMMARY_PERMISSION,
      cta: BUYER_COMMAND_CENTER_HOLD_CTA_BLOCKERS,
    };
  }

  return {
    ...phase,
    headline: BUYER_COMMAND_CENTER_HOLD_HEADLINE,
    summary: BUYER_COMMAND_CENTER_HOLD_SUMMARY_BLOCKERS,
    cta: BUYER_COMMAND_CENTER_HOLD_CTA_BLOCKERS,
  };
}

export function mapConfigLintReadinessForShell(input: Parameters<typeof mapConfigLintReadiness>[0]): ConfigLintReadinessCopy {
  const base = mapConfigLintReadiness(input);

  if (!isBuyerShellHomePresentation()) {
    return base;
  }

  if (input.lint === null || input.lint.loadFailed) {
    return {
      status: base.status,
      summary: BUYER_CONFIG_EVIDENCE_UNAVAILABLE,
    };
  }

  return base;
}

export function shellHealthReadinessSummary(healthLoadFailed: boolean, healthStatus: string | null): string {
  if (!healthLoadFailed) {
    return `Health reports ${healthStatus ?? "unknown"}.`;
  }

  if (!isBuyerShellHomePresentation()) {
    return "Readiness could not be loaded; open system status to inspect the environment.";
  }

  return BUYER_READINESS_UNAVAILABLE;
}

const BUYER_FILTER_CHIP_DISABLED_CLASS =
  "cursor-not-allowed border-neutral-300 bg-neutral-50 text-neutral-500 opacity-80 dark:border-neutral-800 dark:bg-neutral-900/40 dark:text-neutral-500";

/** Selectable but currently empty — muted vs populated, still WCAG AA on light surfaces. */
const BUYER_FILTER_CHIP_EMPTY_CLASS =
  "border-neutral-300 bg-neutral-100 text-neutral-700 hover:border-neutral-400 hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-400 dark:hover:border-neutral-600";

export function buyerFilterChipActiveClass(active: boolean): string {
  return active ? BUYER_FILTER_CHIP_ACTIVE_CLASS : BUYER_FILTER_CHIP_IDLE_CLASS;
}

export function buyerFilterChipClass(active: boolean, disabled: boolean, empty: boolean = false): string {
  if (disabled) {
    return BUYER_FILTER_CHIP_DISABLED_CLASS;
  }

  if (empty && !active) {
    return BUYER_FILTER_CHIP_EMPTY_CLASS;
  }

  return buyerFilterChipActiveClass(active);
}
