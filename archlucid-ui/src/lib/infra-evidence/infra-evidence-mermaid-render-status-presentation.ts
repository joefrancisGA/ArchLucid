import type { EnterpriseStatusKind } from "@/lib/design-tokens";

export function resolveInfraEvidenceMermaidRenderStatusPresentation(input: {
  readonly status: string;
  readonly mermaidEmpty: boolean;
}): { readonly kind: EnterpriseStatusKind; readonly label: string } {
  const normalized = input.status.trim();

  if (normalized === "Succeeded" && input.mermaidEmpty) {
    return {
      kind: "needs-attention",
      label: "Render succeeded with no diagram content",
    };
  }

  switch (normalized) {
    case "Succeeded":
      return { kind: "ready", label: "Render succeeded" };

    case "Partitioned":
      return { kind: "in-progress", label: "Partitioned render" };

    case "Failed":
      return { kind: "blocked", label: "Render failed" };

    default:
      return {
        kind: "neutral",
        label: normalized.length > 0 ? normalized : "Unknown render status",
      };
  }
}
