import { toast } from "sonner";

import { isReviewPresenterChromeActive } from "@/lib/review-presenter-chrome-active";

export function showSuccess(message: string): void {
  if (isReviewPresenterChromeActive()) {
    return;
  }

  toast.success(message);
}

export function showError(message: string, detail?: string, options?: { type?: "error" | "warning" }): void {
  if (isReviewPresenterChromeActive()) {
    return;
  }

  const text = detail ? `${message} — ${detail}` : message;

  if (options?.type === "warning") {
    toast.warning(text);
  } else {
    toast.error(text);
  }
}

export function showInfo(message: string): void {
  if (isReviewPresenterChromeActive()) {
    return;
  }

  toast.message(message);
}
