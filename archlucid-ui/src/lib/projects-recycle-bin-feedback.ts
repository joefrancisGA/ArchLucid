import { DESIGN_TOKENS } from "@/lib/design-tokens";
import type { EnterpriseStatusKind } from "@/lib/design-tokens";

export type ProjectsRecycleBinFeedbackKind = "success" | "conflict" | "error";

export type ProjectsRecycleBinFeedback = Readonly<{
  kind: ProjectsRecycleBinFeedbackKind;
  message: string;
}>;

export function recycleBinFeedbackCalloutClass(kind: ProjectsRecycleBinFeedbackKind): string {
  switch (kind) {
    case "success":
      return DESIGN_TOKENS.callout.success;
    case "conflict":
      return DESIGN_TOKENS.callout.warn;
    case "error":
      return DESIGN_TOKENS.callout.blocked;
    default: {
      const exhaustive: never = kind;

      return exhaustive;
    }
  }
}

export function recycleBinFeedbackStatusKind(kind: ProjectsRecycleBinFeedbackKind): EnterpriseStatusKind {
  switch (kind) {
    case "success":
      return "ready";
    case "conflict":
      return "needs-attention";
    case "error":
      return "blocked";
    default: {
      const exhaustive: never = kind;

      return exhaustive;
    }
  }
}
