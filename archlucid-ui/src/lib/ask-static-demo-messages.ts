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
          "The primary concern is PHI minimization at intake: legacy connectors may retain more patient identifiers than the target architecture allows. The risk is accepted with monitoring and is non-blocking for go-live under the documented governance cadence.\n\n" +
          "The signed manifest records the mitigation pattern and links supporting evidence for governance traceability. The evidence trail links the intake adapters and retention controls to this finding. The audit trail shows governance approval recorded before the package was finalized.\n\n" +
          "Risk:\n\n" +
          "Expanded breach and audit scope if minimization is understated at the intake boundary.\n\n" +
          "Evidence:\n\n" +
          "Signed manifest disposition, evidence trail anchors, and audit events for approval and findings capture.\n\n" +
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
          "Legal review should confirm that every HIPAA-boundary data flow and retention control is documented before sign-off. Undocumented flows or retention gaps are the main blocker.\n\n" +
          "The signed manifest summarizes boundary decisions for this package. The evidence trail links each control point to supporting records. The audit trail shows when findings and approvals were recorded.\n\n" +
          "Risk:\n\n" +
          "Undocumented data flows or retention gaps across the HIPAA boundary could block sign-off.\n\n" +
          "Evidence:\n\n" +
          "Review package narratives, evidence trail anchors, and audit events tied to boundary controls.\n\n" +
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
