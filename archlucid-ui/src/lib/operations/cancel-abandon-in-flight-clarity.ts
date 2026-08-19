/**
 * Source of truth for cancel / abandon clarity on the shell in-flight operations popover (TB-2225).
 * Makes wait vs leave vs stop explicit — leaving does not cancel.
 */

export type CancelAbandonInFlightActionId = "wait" | "leave" | "stop";

export type CancelAbandonInFlightAction = {
  readonly id: CancelAbandonInFlightActionId;
  readonly label: string;
  readonly explanation: string;
};

export type CancelAbandonInFlightClarity = {
  readonly heading: string;
  /** Compact line under the panel "In progress" title. */
  readonly panelHeaderOneLiner: string;
  readonly actions: readonly CancelAbandonInFlightAction[];
};

const ACTION_IDS: readonly CancelAbandonInFlightActionId[] = ["wait", "leave", "stop"] as const;

/**
 * Buyer-facing wait / leave / stop explanations for the in-flight operations affordance.
 */
export function buildCancelAbandonInFlightClarity(): CancelAbandonInFlightClarity {
  return {
    heading: "Wait, leave, or stop",
    panelHeaderOneLiner:
      "Waiting or leaving does not cancel — only Cancel requests stop.",
    actions: [
      {
        id: "wait",
        label: "Wait",
        explanation:
          "Keep watching this panel. Work continues on the server and this list updates as named stages change.",
      },
      {
        id: "leave",
        label: "Leave",
        explanation:
          "Navigate away anytime. The server keeps running — leaving does not cancel the work.",
      },
      {
        id: "stop",
        label: "Stop",
        explanation:
          "Use Cancel to request stop via the API. Cancel is cooperative and may take a moment — it is not an instant mid-work abort.",
      },
    ],
  };
}

/** Guard for tests — matrix must cover every declared action id exactly once. */
export function assertCancelAbandonInFlightClarityComplete(): void {
  const clarity = buildCancelAbandonInFlightClarity();
  const ids = clarity.actions.map((action) => action.id);

  for (const expected of ACTION_IDS) {
    if (!ids.includes(expected)) {
      throw new Error(`Cancel/abandon in-flight clarity missing action: ${expected}`);
    }
  }

  if (ids.length !== ACTION_IDS.length) {
    throw new Error("Cancel/abandon in-flight clarity has unexpected action count.");
  }
}
