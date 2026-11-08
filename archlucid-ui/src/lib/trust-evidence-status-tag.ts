import type { EnterpriseStatusKind } from "@/lib/design-tokens";

export type TrustEvidenceStatusTag = {
  readonly kind: EnterpriseStatusKind;
  readonly label: string;
};

export const TRUST_EVIDENCE_STATUS_NOT_STORED_LABEL = "Status was not stored." as const;

export function trustEvidenceStatusTag(status: string | null | undefined): TrustEvidenceStatusTag {
  if (status === null || status === undefined) {
    return { kind: "needs-attention", label: TRUST_EVIDENCE_STATUS_NOT_STORED_LABEL };
  }

  const trimmed = status.trim();
  const key = trimmed.toLowerCase();

  if (key.length === 0) {
    return { kind: "needs-attention", label: TRUST_EVIDENCE_STATUS_NOT_STORED_LABEL };
  }

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

  return { kind: "neutral", label: trimmed.length > 0 ? trimmed : TRUST_EVIDENCE_STATUS_NOT_STORED_LABEL };
}
