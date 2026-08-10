import type { EnterpriseStatusKind } from "@/lib/design-tokens";

export type TrustEvidenceStatusTag = {
  readonly kind: EnterpriseStatusKind;
  readonly label: string;
};

export function trustEvidenceStatusTag(status: string): TrustEvidenceStatusTag {
  const trimmed = status.trim();
  const key = trimmed.toLowerCase();

  if (key === "available") {
    return { kind: "ready", label: "Ready" };
  }

  if (key === "missing") {
    return { kind: "needs-attention", label: "Needs attention" };
  }

  if (key === "low confidence") {
    return { kind: "needs-attention", label: "Needs attention" };
  }

  if (key === "demo-only") {
    return { kind: "draft", label: "Draft" };
  }

  if (key === "recorded") {
    return { kind: "neutral", label: "Recorded" };
  }

  if (key === "not applicable") {
    return { kind: "neutral", label: "Not applicable" };
  }

  return { kind: "neutral", label: trimmed.length > 0 ? trimmed : "—" };
}
