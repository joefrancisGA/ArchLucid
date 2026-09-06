/** UI types for IE-UX-04 Infrastructure Ask workbench. */

export type InfraEvidenceAskCitation = {
  kind: string;
  id: string;
  label: string | null;
};

export type InfraEvidenceAskRequest = {
  question: string;
  cloudResourceId?: string | null;
  runId?: string | null;
  snapshotId?: string | null;
  sinceUtc?: string | null;
  diffId?: string | null;
  assessmentId?: string | null;
  auditEvidenceSnapshotId?: string | null;
  controlId?: string | null;
  useSimulator?: boolean;
};

export type InfraEvidenceAskResponse = {
  topicKind: string;
  answer: string;
  insufficientEvidence: boolean;
  citations: InfraEvidenceAskCitation[];
  simulatorLabel: string | null;
};

export const INFRA_EVIDENCE_ASK_CANNED_QUESTIONS: readonly string[] = [
  "What changed since baseline?",
  "Why is this PIP public?",
  "Which control evidences this resource?",
];
