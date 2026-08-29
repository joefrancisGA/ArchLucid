"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

import { formatOperationalErrorUtc, type OperationalErrorRow } from "./operational-errors-presentation";

export type OperationalErrorsDetailPanelProps = {
  row: OperationalErrorRow | null;
  onClose: () => void;
};

export function OperationalErrorsDetailPanel({ row, onClose }: OperationalErrorsDetailPanelProps) {
  if (row === null)
    return null;

  return (
    <Card className="border-al-border-subtle">
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
        <CardTitle className={OPERATOR_TYPOGRAPHY.sectionTitle}>Error detail</CardTitle>
        <Button type="button" variant="outline" size="sm" onClick={onClose}>
          Close
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        <DetailField label="Occurred (UTC)" value={formatOperationalErrorUtc(row.occurredUtc)} />
        <DetailField label="Category" value={row.category} />
        <DetailField label="Source" value={row.source} />
        <DetailField label="HTTP status" value={row.httpStatusCode?.toString() ?? "—"} />
        <DetailField label="Method" value={row.httpMethod ?? "—"} />
        <DetailField label="Path" value={row.requestPath ?? "—"} mono />
        <DetailField label="Problem type" value={row.problemType ?? "—"} mono />
        <DetailField label="Exception type" value={row.exceptionType ?? "—"} mono />
        <DetailField label="SQL error number" value={row.sqlErrorNumber?.toString() ?? "—"} />
        <DetailField label="Correlation ID" value={row.correlationId ?? "—"} mono />
        <DetailField label="Trace ID" value={row.otelTraceId ?? "—"} mono />
        <DetailField label="Tenant ID" value={row.tenantId ?? "—"} mono />
        <DetailField label="Actor" value={row.actorUserId ?? "—"} mono />
        <div>
          <p className={cn("mb-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.label)}>Message</p>
          <pre className={cn("overflow-x-auto rounded-md border border-al-border-subtle bg-al-surface-muted p-3 whitespace-pre-wrap", OPERATOR_TYPOGRAPHY.micro)}>
            {row.message}
          </pre>
        </div>
        {row.stackTrace ? (
          <div>
            <p className={cn("mb-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.label)}>Stack trace</p>
            <pre className={cn("max-h-64 overflow-auto rounded-md border border-al-border-subtle bg-al-surface-muted p-3 whitespace-pre-wrap", OPERATOR_TYPOGRAPHY.micro)}>
              {row.stackTrace}
            </pre>
          </div>
        ) : null}
        <div>
          <p className={cn("mb-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.label)}>Detail JSON</p>
          <pre className={cn("max-h-40 overflow-auto rounded-md border border-al-border-subtle bg-al-surface-muted p-3 whitespace-pre-wrap", OPERATOR_TYPOGRAPHY.micro)}>
            {row.detailJson}
          </pre>
        </div>
        {row.correlationId ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              void navigator.clipboard.writeText(row.correlationId ?? "");
            }}
          >
            Copy correlation ID
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}

function DetailField({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div>
      <p className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.label)}>{label}</p>
      <p className={cn(mono && "font-mono break-all", OPERATOR_TYPOGRAPHY.helper)}>{value}</p>
    </div>
  );
}
