export type TrialLimitModalPayload = {
  title: string;
  detail: string;
  trialReason: string;
  daysRemaining: number | null;
};

type TrialLimitModalListener = (payload: TrialLimitModalPayload) => void;

const listeners = new Set<TrialLimitModalListener>();

export function subscribeTrialLimitModal(listener: TrialLimitModalListener): () => void {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}

export function openTrialLimitModal(payload: TrialLimitModalPayload): void {
  for (const listener of listeners) {
    listener(payload);
  }
}

export function notifyTrialLimitFromApiError(
  problemTitle: string | undefined,
  problemDetail: string | undefined,
  trial: { trialReason: string; daysRemaining: number | null },
): void {
  openTrialLimitModal({
    title: problemTitle?.trim() || "Trial limit reached",
    detail: problemDetail?.trim() ?? "",
    trialReason: trial.trialReason,
    daysRemaining: trial.daysRemaining,
  });
}
