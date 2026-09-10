const INFRA_EVIDENCE_ASK_TOPIC_KIND_LABELS: Record<string, string> = {
  SubscriptionChange: "Subscription change",
  Drift: "Inventory drift",
  DiagramGap: "Diagram gap",
  PatternCoverage: "Pattern coverage",
  ArchitectureAsOfDate: "Architecture as of date",
  AuditControlEvidence: "Audit control evidence",
  ResourceOverview: "Resource overview",
  InventoryChange: "Inventory change",
};

export function formatInfraEvidenceAskTopicKindLabel(topicKind: string): string {
  const trimmed = topicKind.trim();

  if (trimmed.length === 0) {
    return "Answer";
  }

  const mapped = INFRA_EVIDENCE_ASK_TOPIC_KIND_LABELS[trimmed];

  if (mapped != null) {
    return mapped;
  }

  const spaced = trimmed.replace(/([a-z])([A-Z])/g, "$1 $2");

  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}
