import { isBrowser } from "./http-auth";

export function notifyIfIdempotencyReplayed(response: Response): void {
  if (isBrowser() && response.headers.get("X-Idempotency-Replayed") === "true") {
    void import("@/lib/toast").then(({ showInfo }) => {
      showInfo("Resumed previous request — no duplicate review created.");
    });
  }
}
