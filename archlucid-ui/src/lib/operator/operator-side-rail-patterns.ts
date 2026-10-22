/**
 * TB-1576 — Static checks for operator side-rail contract compliance.
 *
 * Contract: `operator-side-rail-inventory.ts` checklist + `UI_DESIGN_SYSTEM.md` § Operator side rails.
 */

import { OPERATOR_LIVE_PREVIEW_READINESS_RAIL_KIND } from "@/lib/operator/operator-live-preview-readiness-rail";
import type { OperatorSideRailInventoryEntry } from "@/lib/operator/operator-side-rail-inventory";
import { OPERATOR_SIDE_RAIL_BANNED_KINDS } from "@/lib/operator/operator-side-rail-inventory";

export type OperatorSideRailGuardViolation = {
  readonly code:
    | "banned-rail-kind-marker"
    | "demoted-about-aside-two-col"
    | "missing-allowed-rail-marker";
  readonly message: string;
};

/** TB-1575 demoted about-aside shell — persistent two-col at lg with 17.5rem rail. */
export const OPERATOR_SIDE_RAIL_ABOUT_ASIDE_TWO_COL_CLASS_PATTERN =
  /lg:grid-cols-\[minmax\(0,1fr\)_17\.5rem\]/;

export const OPERATOR_SIDE_RAIL_MAIN_WITH_STICKY_ASIDE_PATTERN =
  /OPERATOR_LAYOUT\.mainWithStickyAside/;

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function bannedKindMarkerPatterns(): RegExp[] {
  return OPERATOR_SIDE_RAIL_BANNED_KINDS.map(
    (kind) => new RegExp(`data-operator-side-rail-kind=["']${escapeRegExp(kind)}["']`),
  );
}

export function findOperatorSideRailBannedKindMarkerViolations(
  source: string,
): readonly OperatorSideRailGuardViolation[] {
  const violations: OperatorSideRailGuardViolation[] = [];

  for (const pattern of bannedKindMarkerPatterns()) {
    if (pattern.test(source)) {
      violations.push({
        code: "banned-rail-kind-marker",
        message: `Banned side-rail kind marker matched ${pattern}.`,
      });
    }
  }

  return violations;
}

export function surfaceUsesDemotedAboutAsideTwoColShell(source: string): boolean {
  if (OPERATOR_SIDE_RAIL_MAIN_WITH_STICKY_ASIDE_PATTERN.test(source)) {
    return true;
  }

  return OPERATOR_SIDE_RAIL_ABOUT_ASIDE_TWO_COL_CLASS_PATTERN.test(source);
}

export function findOperatorSideRailDemotedTwoColViolations(
  source: string,
): readonly OperatorSideRailGuardViolation[] {
  if (!surfaceUsesDemotedAboutAsideTwoColShell(source)) {
    return [];
  }

  return [
    {
      code: "demoted-about-aside-two-col",
      message:
        "Demoted integration/hub surfaces must not use mainWithStickyAside or lg:grid-cols-[minmax(0,1fr)_17.5rem].",
    },
  ];
}

function liveRailMarkerPatterns(): RegExp[] {
  return [
    /data-rail-kind=\{OPERATOR_LIVE_PREVIEW_READINESS_RAIL_KIND\}/,
    new RegExp(`data-rail-kind=["']${OPERATOR_LIVE_PREVIEW_READINESS_RAIL_KIND}["']`),
    /<OperatorLivePreviewPinLayout[\s/>]/,
  ];
}

function allowedKindMarkerPatterns(kind: OperatorSideRailInventoryEntry["kind"]): RegExp[] {
  if (kind === "none") {
    return [/data-operator-side-rail-kind=["']none["']/];
  }

  if (kind === OPERATOR_LIVE_PREVIEW_READINESS_RAIL_KIND) {
    return liveRailMarkerPatterns();
  }

  if (kind === "working-object") {
    return [
      /data-operator-side-rail-kind=["']working-object["']/,
      /data-operator-side-rail-kind=\{[^}]*\?\s*["']working-object["']\s*:\s*["']none["']/,
    ];
  }

  return [new RegExp(`data-operator-side-rail-kind=["']${escapeRegExp(kind)}["']`)];
}

export function surfaceDeclaresAllowedRailKind(
  source: string,
  kind: OperatorSideRailInventoryEntry["kind"],
): boolean {
  if (kind === "none") {
    return true;
  }

  return allowedKindMarkerPatterns(kind).some((pattern) => pattern.test(source));
}

export function findOperatorSideRailMissingAllowedMarkerViolations(
  source: string,
  kind: OperatorSideRailInventoryEntry["kind"],
): readonly OperatorSideRailGuardViolation[] {
  if (kind === "none") {
    return [];
  }

  if (surfaceDeclaresAllowedRailKind(source, kind)) {
    return [];
  }

  return [
    {
      code: "missing-allowed-rail-marker",
      message: `Expected a ${kind} side-rail kind marker (data-operator-side-rail-kind or data-rail-kind).`,
    },
  ];
}

export function findOperatorSideRailModuleViolations(
  source: string,
  options: {
    readonly disposition: OperatorSideRailInventoryEntry["disposition"];
    readonly kind: OperatorSideRailInventoryEntry["kind"];
  },
): readonly OperatorSideRailGuardViolation[] {
  const violations: OperatorSideRailGuardViolation[] = [
    ...findOperatorSideRailBannedKindMarkerViolations(source),
  ];

  if (options.disposition === "demoted-single-column") {
    violations.push(...findOperatorSideRailDemotedTwoColViolations(source));
  }

  if (options.disposition === "allowed") {
    violations.push(...findOperatorSideRailMissingAllowedMarkerViolations(source, options.kind));
  }

  return violations;
}
