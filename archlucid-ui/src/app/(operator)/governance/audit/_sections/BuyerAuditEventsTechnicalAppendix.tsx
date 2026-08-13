import { cn } from "@/lib/utils";
import type { AuditEvent } from "@/lib/api";
import { buyerSafeTechnicalIdLabel } from "@/lib/buyer/buyer-demo-persona-labels";
import { OPERATOR_DISCLOSURE_TRIGGER_CLASS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { formatUtc, tryFormatDataJson } from "./audit-page-helpers";
import { pipelineEventTypeFriendlyLabel } from "@/lib/pipeline-event-type-labels";

type BuyerAuditEventsTechnicalAppendixProps = {
  events: AuditEvent[];
};

export function BuyerAuditEventsTechnicalAppendix(props: BuyerAuditEventsTechnicalAppendixProps) {
  const { events } = props;

  return (
    <details className="mt-4 rounded-lg border border-neutral-200 bg-neutral-50/80 p-3 dark:border-neutral-700 dark:bg-neutral-900/40">
      <summary className={cn("cursor-pointer text-al-text-primary", OPERATOR_DISCLOSURE_TRIGGER_CLASS)}>
        Audit verification appendix
      </summary>
      <div className="mt-3 space-y-4">
        {events.map((ev) => (
          <div
            key={ev.eventId}
            className="border-t border-neutral-200 pt-4 first:border-t-0 first:pt-0 dark:border-neutral-700"
          >
            <p className={cn("m-0 font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.micro)}>
              {formatUtc(ev.occurredUtc)} · {pipelineEventTypeFriendlyLabel(ev.eventType)}
            </p>
            <div className={cn("mt-2 space-y-3 text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
              <div>
                <span className={cn("font-medium text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>User id</span>{" "}
                <span className={cn("font-mono", OPERATOR_TYPOGRAPHY.micro)}>{buyerSafeTechnicalIdLabel(ev.actorUserId)}</span>
              </div>
              <div>
                <span className={cn("font-medium text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>Correlation ID</span>{" "}
                <span className={cn("font-mono", OPERATOR_TYPOGRAPHY.micro)}>
                  {buyerSafeTechnicalIdLabel(ev.correlationId)}
                </span>
              </div>
              {ev.otelTraceId ? (
                <div>
                  <span className={cn("font-medium text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>Trace</span>{" "}
                  <code title={ev.otelTraceId} className={OPERATOR_TYPOGRAPHY.micro}>
                    {ev.otelTraceId.slice(0, 16)}…
                  </code>
                </div>
              ) : null}
              <div>
                <p className={cn("m-0 font-medium text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>Payload</p>
                <pre
                  className={cn(
                    "mt-1 max-h-48 overflow-auto rounded-md bg-neutral-50/90 p-2 dark:bg-neutral-900/50",
                    OPERATOR_TYPOGRAPHY.micro,
                  )}
                >
                  {tryFormatDataJson(ev.dataJson)}
                </pre>
              </div>
            </div>
          </div>
        ))}
      </div>
    </details>
  );
}
