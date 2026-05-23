import { toast } from "sonner";

export function showSuccess(message: string): void {
  toast.success(message);
}

export function showError(message: string, detail?: string, options?: { type?: "error" | "warning" }): void {
  const text = detail ? `${message} — ${detail}` : message;

  if (options?.type === "warning") {
    toast.warning(text);
  } else {
    toast.error(text);
  }
}

export function showInfo(message: string): void {
  toast.message(message);
}
