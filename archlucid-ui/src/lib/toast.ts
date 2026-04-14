import { toast } from "sonner";

export function showSuccess(message: string): void {
  toast.success(message);
}

export function showError(message: string, detail?: string): void {
  const text = detail ? `${message} — ${detail}` : message;
  toast.error(text);
}

export function showInfo(message: string): void {
  toast.message(message);
}
