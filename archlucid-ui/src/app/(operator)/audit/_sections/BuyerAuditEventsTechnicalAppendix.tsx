import type { AuditEvent } from "@/lib/api";
import { formatUtc, tryFormatDataJson } from "./audit-page-helpers";
import { pipelineEventTypeFriendlyLabel } from "@/lib/pipeline-event-type-labels";

type BuyerAuditEventsTechnicalAppendixProps = {
  events: AuditEvent[];
};

export function BuyerAuditEventsTechnicalAppendix(props: BuyerAuditEventsTechnicalAppendixProps) {
  const { events } = props;

  return (
    <details className="mt-4 rounded-lg border border-neutral-200 bg-neutral-50/80 p-3 dark:border-neutral-700 dark:bg-neutral-900/40">
      <summary className="cursor-pointer text-sm font-medium text-neutral-800 dark:text-neutral-200">
        Technical correlation appendix
      </summary>
      <div className="mt-3 space-y-4">
        {events.map((ev) => (
          <div
            key={ev.eventId}
            className="border-t border-neutral-200 pt-4 first:border-t-0 first:pt-0 dark:border-neutral-700"
          >
            <p className="m-0 text-xs font-semibold text-neutral-700 dark:text-neutral-300">
              {formatUtc(ev.occurredUtc)} · {pipelineEventTypeFriendlyLabel(ev.eventType)}
            </p>
            <div className="mt-2 space-y-3 text-sm text-neutral-700 dark:text-neutral-300">
              <div>
                <span className="font-medium text-neutral-600 dark:text-neutral-400">User id</span>{" "}
                <span className="font-mono text-xs">{ev.actorUserId}</span>
              </div>
              <div>
                <span className="font-medium text-neutral-600 dark:text-neutral-400">Correlation ID</span>{" "}
                <span className="font-mono text-xs">
                  {(ev.correlationId ?? "").trim().length > 0 ? ev.correlationId : "—"}
                </span>
              </div>
              {ev.otelTraceId ? (
                <div>
                  <span className="font-medium text-neutral-600 dark:text-neutral-400">Trace</span>{" "}
                  <code title={ev.otelTraceId} className="text-xs">
                    {ev.otelTraceId.slice(0, 16)}…
                  </code>
                </div>
              ) : null}
              <div>
                <p className="m-0 text-xs font-medium text-neutral-600 dark:text-neutral-400">Payload</p>
                <pre className="mt-1 max-h-48 overflow-auto rounded-md bg-neutral-50/90 p-2 text-xs dark:bg-neutral-900/50">
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
