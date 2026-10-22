export type DecisionRegisterDatePreset = "30" | "90" | "all";

export type DecisionRegisterDateRange = {
  readonly recordedAfter: string;
  readonly recordedBefore: string;
};

/** HTML date input value (YYYY-MM-DD) in local calendar. */
export function toDateInputValue(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function resolveDecisionRegisterDateRange(preset: DecisionRegisterDatePreset, today: Date = new Date()): DecisionRegisterDateRange {
  if (preset === "all") {
    return {
      recordedAfter: "",
      recordedBefore: "",
    };
  }

  const before = new Date(today);
  const after = new Date(today);

  if (preset === "30") {
    after.setDate(after.getDate() - 30);
  } else {
    after.setDate(after.getDate() - 90);
  }

  return {
    recordedAfter: toDateInputValue(after),
    recordedBefore: toDateInputValue(before),
  };
}

export const DEFAULT_DECISION_REGISTER_DATE_PRESET: DecisionRegisterDatePreset = "90";
