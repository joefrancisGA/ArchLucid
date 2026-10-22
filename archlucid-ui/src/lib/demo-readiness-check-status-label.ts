import type { BuyerCtoDemoReadinessCheckStatus } from "@/lib/buyer/buyer-cto-demo-readiness";

/** Status vocabulary for demo-readiness check rows — not the long check title (TB-1413). */
export function demoReadinessCheckStatusLabel(status: BuyerCtoDemoReadinessCheckStatus): string {
  switch (status) {
    case "pass":
      return "Pass";
    case "warn":
      return "Warn";
    case "fail":
      return "Fail";
    case "pending":
      return "Pending";
    default: {
      const exhaustive: never = status;
      return exhaustive;
    }
  }
}

export function demoReadinessCheckStatusKind(
  status: BuyerCtoDemoReadinessCheckStatus,
): "ready" | "needs-attention" | "blocked" {
  switch (status) {
    case "pass":
      return "ready";
    case "warn":
    case "pending":
      return "needs-attention";
    case "fail":
      return "blocked";
    default: {
      const exhaustive: never = status;
      return exhaustive;
    }
  }
}
