import { toast } from "sonner";

import { isReviewPresenterChromeActive } from "@/lib/review-presenter-chrome-active";

/** Sonner default auto-dismiss for transient operator feedback (GET blips, clipboard echoes). */
export const TOAST_DEFAULT_DURATION_MS = 4000;

/** Mutation failure toasts stay until the operator dismisses them (LW-097). */
export const TOAST_STICKY_DURATION = Number.POSITIVE_INFINITY;

export type ToastErrorOptions = {
  readonly type?: "error" | "warning";
  readonly sticky?: boolean;
  readonly duration?: number;
  readonly description?: string;
};

export function resolveToastDuration(
  options?: Pick<ToastErrorOptions, "sticky" | "duration">,
): number {
  if (options?.duration !== undefined) {
    return options.duration;
  }

  if (options?.sticky === true) {
    return TOAST_STICKY_DURATION;
  }

  return TOAST_DEFAULT_DURATION_MS;
}

export function showSuccess(message: string): void {
  if (isReviewPresenterChromeActive()) {
    return;
  }

  toast.success(message);
}

export function showError(message: string, detail?: string, options?: ToastErrorOptions): void {
  if (isReviewPresenterChromeActive()) {
    return;
  }

  const duration = resolveToastDuration(options);
  const text = detail ? `${message} — ${detail}` : message;
  const toastFn = options?.type === "warning" ? toast.warning : toast.error;

  if (options?.description !== undefined && options.description.length > 0) {
    toastFn(message, { description: options.description, duration });

    return;
  }

  toastFn(text, { duration });
}

/** Sticky variant for livelihood mutation failures (draft save, disposition, approval, finalize, share). */
export function showMutationError(message: string, detail?: string, options?: Omit<ToastErrorOptions, "sticky" | "duration">): void {
  showError(message, detail, { ...options, sticky: true });
}

export type MutationSonnerToastOptions = {
  readonly description?: string;
  readonly action?: {
    readonly label: string;
    readonly onClick: () => void;
  };
};

/** Sticky Sonner toast when mutation failures need action buttons or multi-line chrome. */
export function showMutationSonnerError(message: string, options?: MutationSonnerToastOptions): void {
  if (isReviewPresenterChromeActive()) {
    return;
  }

  toast.error(message, { ...options, duration: TOAST_STICKY_DURATION });
}

export function showInfo(message: string): void {
  if (isReviewPresenterChromeActive()) {
    return;
  }

  toast.message(message);
}
