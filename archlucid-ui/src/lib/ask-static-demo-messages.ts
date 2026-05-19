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
          "PHI minimization at intake is the primary executive concern: legacy connectors may retain more identifiers than the target architecture allows. The risk is accepted with monitoring and is non-blocking for go-live.\n\n" +
          "Risk:\n\nExpanded breach and audit scope if minimization is understated at the intake boundary.\n\n" +
          "Evidence:\n\nSigned manifest disposition, evidence trail anchors, and audit events for approval and findings capture.\n\n" +
          "Mitigation:\n\nAlign adapters to the minimization posture documented in the review package before sign-off.\n\n" +
          "Validation:\n\nConfirm checklist completion on the findings panel and manifest summary before go-live.",
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
          "Legal review should confirm that every HIPAA-boundary data flow and retention control is documented before sign-off.\n\n" +
          "Risk:\n\nUndocumented data flows or retention gaps across the HIPAA boundary could block sign-off.\n\n" +
          "Evidence:\n\nReview package narratives, evidence trail anchors, and audit events tied to boundary controls.\n\n" +
          "Mitigation:\n\nDocument flows, subprocessors touching PHI, and monitoring proof before legal review completes.\n\n" +
          "Validation:\n\nCheck that each legal question maps to an artifact or finding with a clear owner.",
        createdUtc: "2026-01-10T14:25:18.000Z",
        metadataJson: "{}",
      },
    ];
  }

  return null;
}
