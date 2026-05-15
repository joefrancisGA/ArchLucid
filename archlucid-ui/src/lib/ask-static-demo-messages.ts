import { isStaticDemoPayloadFallbackActiveForRun } from "@/lib/operator-static-demo";
import { SHOWCASE_STATIC_DEMO_RUN_ID } from "@/lib/showcase-static-demo";
import type { ConversationMessage } from "@/types/conversation";

/**
 * When live Ask APIs return no rows but the Claims Intake spine is active, supply readable placeholder dialogue so the
 * demo does not show an empty thread beside saved conversation headers.
 */
export function tryStaticDemoConversationMessages(threadId: string): ConversationMessage[] | null {
  if (!isStaticDemoPayloadFallbackActiveForRun(SHOWCASE_STATIC_DEMO_RUN_ID)) {
    return null;
  }

  const tid = threadId.trim();

  if (tid === "thread-claims-intake-001") {
    return [
      {
        messageId: "demo-msg-claims-001-user",
        threadId: tid,
        role: "User",
        content: "Summarize the PHI risk for this review for an executive sponsor.",
        createdUtc: "2026-01-12T10:06:00.000Z",
        metadataJson: "{}",
      },
      {
        messageId: "demo-msg-claims-001-asst",
        threadId: tid,
        role: "Assistant",
        content:
          "Risk:\n\n" +
          "PHI minimization at the intake boundary: legacy connectors may retain more patient identifiers than the " +
          "target architecture allows.\n\n" +
          "Evidence:\n\n" +
          "The finalized manifest records the mitigation pattern and links supporting evidence for governance traceability.\n\n" +
          "Mitigation:\n\n" +
          "Align adapters to the minimization posture documented in the review package before sign-off.\n\n" +
          "Validation:\n\n" +
          "Confirm checklist completion on the findings panel and manifest summary before go-live.\n\n" +
          "Sources: executive summary, finalized manifest package, PHI minimization risk, evidence graph, and audit trail.",
        createdUtc: "2026-01-12T10:06:12.000Z",
        metadataJson: "{}",
      },
    ];
  }

  if (tid === "thread-hipaa-boundary-002") {
    return [
      {
        messageId: "demo-msg-hipaa-002-user",
        threadId: tid,
        role: "User",
        content: "What should legal review before we sign off on the HIPAA boundary treatment?",
        createdUtc: "2026-01-10T14:25:00.000Z",
        metadataJson: "{}",
      },
      {
        messageId: "demo-msg-hipaa-002-asst",
        threadId: tid,
        role: "Assistant",
        content:
          "Risk:\n\n" +
          "Undocumented data flows or retention gaps across the HIPAA boundary could block sign-off.\n\n" +
          "Evidence:\n\n" +
          "Use the review package to tie each control point to evidence in the trail graph.\n\n" +
          "Mitigation:\n\n" +
          "Document flows, subprocessors touching PHI, and monitoring proof before legal review completes.\n\n" +
          "Validation:\n\n" +
          "Check that each legal question maps to an artifact or finding with a clear owner.\n\n" +
          "Sources: executive summary, finalized manifest package, PHI minimization risk, evidence graph, and audit trail.",
        createdUtc: "2026-01-10T14:25:18.000Z",
        metadataJson: "{}",
      },
    ];
  }

  return null;
}
