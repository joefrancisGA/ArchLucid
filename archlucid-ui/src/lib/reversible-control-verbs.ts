/**
 * Canonical action verb pairs for reversible on/off controls (TB-2383).
 *
 * The same reversible toggle was labelled differently per surface: digest subscriptions and
 * advisory scans offered "Pause / Resume" while recurrence schedules offered "Disable / Enable",
 * even though all three stop and restart a recurring activity. The split below is drawn from what
 * the control actually does to the object, not from which team built the surface.
 */

export type ReversibleControlKind =
  /**
   * A recurring activity that fires on a schedule. Stopping it suppresses future occurrences while
   * the configuration and history stay intact, so the object is still "there" — it is just idle.
   */
  | "recurring-activity"
  /**
   * A capability or delivery destination that is either available or not. Stopping it removes the
   * capability rather than idling an activity, so on/off framing is the honest one.
   */
  | "capability";

export type ReversibleControlVerbs = {
  /** Label shown while the control is on — the action stops it. */
  readonly stop: string;
  /** Label shown while the control is off — the action starts it. */
  readonly start: string;
};

export type ReversibleControlStateLabels = {
  /** State label shown while the control is on. */
  readonly on: string;
  /** State label shown while the control is off. */
  readonly off: string;
};

const REVERSIBLE_CONTROL_VERBS: Readonly<Record<ReversibleControlKind, ReversibleControlVerbs>> = {
  "recurring-activity": { stop: "Pause", start: "Resume" },
  capability: { stop: "Disable", start: "Enable" },
};

const REVERSIBLE_CONTROL_STATES: Readonly<Record<ReversibleControlKind, ReversibleControlStateLabels>> = {
  "recurring-activity": { on: "Active", off: "Paused" },
  capability: { on: "Enabled", off: "Disabled" },
};

export function reversibleControlVerbs(kind: ReversibleControlKind): ReversibleControlVerbs {
  return REVERSIBLE_CONTROL_VERBS[kind];
}

export function reversibleControlStates(kind: ReversibleControlKind): ReversibleControlStateLabels {
  return REVERSIBLE_CONTROL_STATES[kind];
}

/** Resolves the label for a reversible control given its current on/off state. */
export function reversibleControlLabel(kind: ReversibleControlKind, isOn: boolean): string {
  const verbs = reversibleControlVerbs(kind);

  return isOn ? verbs.stop : verbs.start;
}

/**
 * Resolves the state label that pairs with {@link reversibleControlLabel}. Keeping both in one
 * module is what stops a row from reading "Disabled" beside a "Resume" button.
 */
export function reversibleControlStateLabel(kind: ReversibleControlKind, isOn: boolean): string {
  const states = reversibleControlStates(kind);

  return isOn ? states.on : states.off;
}
