"use client";

import { cn } from "@/lib/utils";
import { AlertTriangle, CheckCircle2, CircleDashed } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { OperatorApiProblem } from "@/components/operator/OperatorApiProblem";
import { OperatorLoadingNotice } from "@/components/operator/OperatorShellMessage";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { StatusTag } from "@/components/ui/status-tag";
import { getPreFinalizeChecklist } from "@/lib/api/pre-finalize-checklist";
import { isApiRequestError } from "@/lib/api-request-error";
import { OPERATOR_CARD, OPERATOR_TYPOGRAPHY, type EnterpriseStatusKind } from "@/lib/design-tokens";
import { REVIEW_PACKAGE_LABEL } from "@/lib/usability/canonical-product-terms";
import type {
  PreFinalizeChecklistItem,
  PreFinalizeChecklistItemStatus,
} from "@/types/pre-finalize-checklist";

export type PreFinalizeChecklistPanelProps = {
  readonly runId: string;
  readonly manifestFinalized: boolean;
};

function statusTagKind(status: PreFinalizeChecklistItemStatus): EnterpriseStatusKind {
  switch (status) {
    case "Clear":
      return "ready";
    case "Advisory":
      return "needs-attention";
    case "Blocking":
      return "blocked";
    default:
      return "neutral";
  }
}

function statusLabel(status: PreFinalizeChecklistItemStatus): string {
  switch (status) {
    case "Clear":
      return "Clear";
    case "Advisory":
      return "Advisory";
    case "Blocking":
      return "Blocking";
    default:
      return status;
  }
}

function StatusIcon({ status }: { readonly status: PreFinalizeChecklistItemStatus }): React.JSX.Element {
  if (status === "Clear") {
    return <CheckCircle2 className="size-4 text-emerald-600" aria-hidden />;
  }

  if (status === "Blocking") {
    return <AlertTriangle className="size-4 text-destructive" aria-hidden />;
  }

  return <CircleDashed className="size-4 text-amber-600" aria-hidden />;
}

function ChecklistRow({ item }: { readonly item: PreFinalizeChecklistItem }): React.JSX.Element {
  return (
    <li className="flex items-start gap-3 rounded-md border border-border/60 px-3 py-3">
      <StatusIcon status={item.status} />
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className={cn(OPERATOR_TYPOGRAPHY.cardTitle, "text-sm")}>{item.title}</p>
          <StatusTag kind={statusTagKind(item.status)} label={statusLabel(item.status)} />
          {item.count > 0 ? (
            <span className={cn(OPERATOR_TYPOGRAPHY.helper, "text-muted-foreground")}>
              {item.count}
            </span>
          ) : null}
        </div>
        {item.detail ? (
          <p className={cn(OPERATOR_TYPOGRAPHY.helper, "text-muted-foreground")}>{item.detail}</p>
        ) : null}
      </div>
    </li>
  );
}

export function PreFinalizeChecklistPanel({
  runId,
  manifestFinalized,
}: PreFinalizeChecklistPanelProps): React.JSX.Element | null {
  const [checklist, setChecklist] = useState<Awaited<ReturnType<typeof getPreFinalizeChecklist>> | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadChecklist = useCallback(async () => {
    setLoading(true);
    setLoadError(null);

    try {
      const response = await getPreFinalizeChecklist(runId);
      setChecklist(response);
    } catch (error: unknown) {
      setChecklist(null);
      setLoadError(isApiRequestError(error) ? error.message : "Unable to load pre-finalize checklist.");
    } finally {
      setLoading(false);
    }
  }, [runId]);

  useEffect(() => {
    if (manifestFinalized) {
      setLoading(false);
      return;
    }

    void loadChecklist();
  }, [loadChecklist, manifestFinalized]);

  if (manifestFinalized) {
    return null;
  }

  return (
    <Card>
      <CardHeader className={OPERATOR_CARD.header}>
        <div className="flex flex-wrap items-center gap-2">
          <h3 className={OPERATOR_TYPOGRAPHY.sectionTitle}>Pre-finalize checklist</h3>
          {checklist ? (
            <StatusTag
              kind={checklist.readyToFinalize ? "ready" : "needs-attention"}
              label={checklist.readyToFinalize ? "Ready to finalize" : "Review before finalize"}
            />
          ) : null}
        </div>
        <p className={cn(OPERATOR_TYPOGRAPHY.helper, "text-muted-foreground")}>
          Human approval gates and advisory checks before sealing the {REVIEW_PACKAGE_LABEL.toLowerCase()}.
        </p>
      </CardHeader>
      <CardContent className={OPERATOR_CARD.content}>
        {loading ? <OperatorLoadingNotice>Loading pre-finalize checklist…</OperatorLoadingNotice> : null}
        {loadError ? (
          <OperatorApiProblem problem={null} fallbackMessage={loadError} variant="warning" />
        ) : null}
        {!loading && !loadError && checklist ? (
          <ul className="space-y-2" data-testid="pre-finalize-checklist-items">
            {checklist.items.map((item) => (
              <ChecklistRow key={item.itemId} item={item} />
            ))}
          </ul>
        ) : null}
      </CardContent>
    </Card>
  );
}
