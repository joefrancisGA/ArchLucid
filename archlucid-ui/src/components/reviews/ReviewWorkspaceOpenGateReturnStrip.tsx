"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { useOperatorScopeQueryKey } from "@/hooks/use-operator-scope-query-key";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { ArchLucidOpenGateReturnRecord } from "@/lib/architecture/archlucid-open-gate-return-storage";
import { readArchLucidOpenGateReturnRecord } from "@/lib/architecture/archlucid-open-gate-return-storage";
import {
  REVIEW_WORKSPACE_OPEN_GATE_RETURN_BROWSER_LOCAL,
  REVIEW_WORKSPACE_OPEN_GATE_RETURN_HOME_HREF,
  REVIEW_WORKSPACE_OPEN_GATE_RETURN_HOME_LABEL,
  REVIEW_WORKSPACE_OPEN_GATE_RETURN_LEAD,
  REVIEW_WORKSPACE_OPEN_GATE_RETURN_SAME_REVIEW_PREFIX,
} from "@/lib/reviews/review-workspace-open-gate-return-strip-copy";
import { cn } from "@/lib/utils";

export type ReviewWorkspaceOpenGateReturnStripProps = {
  readonly runId: string;
};

export function ReviewWorkspaceOpenGateReturnStrip(
  props: ReviewWorkspaceOpenGateReturnStripProps,
): React.JSX.Element {
  const scope = useOperatorScopeQueryKey();
  const [ready, setReady] = useState(false);
  const [record, setRecord] = useState<ArchLucidOpenGateReturnRecord | null>(null);
  const trimmedRunId = props.runId.trim();

  useEffect(() => {
    setReady(true);
    setRecord(readArchLucidOpenGateReturnRecord(scope.workspaceId));
  }, [scope.workspaceId]);

  const sameReview =
    ready
    && record !== null
    && record.runId.trim() === trimmedRunId
    && record.openGateLabel.trim().length > 0;

  return (
    <section
      className={cn(
        "rounded-md border border-dashed border-neutral-300 bg-neutral-50/60 px-3 py-3 dark:border-neutral-700 dark:bg-neutral-900/30",
        OPERATOR_TYPOGRAPHY.helper,
      )}
      data-testid="review-workspace-open-gate-return-strip"
      aria-label="Resume open gate"
    >
      <p className="m-0 text-al-text-secondary">{REVIEW_WORKSPACE_OPEN_GATE_RETURN_LEAD}</p>
      <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.micro)}>
        {REVIEW_WORKSPACE_OPEN_GATE_RETURN_BROWSER_LOCAL}
      </p>
      {sameReview && record !== null ? (
        <p className="m-0 mt-2" data-testid="review-workspace-open-gate-return-same-review">
          {REVIEW_WORKSPACE_OPEN_GATE_RETURN_SAME_REVIEW_PREFIX}{" "}
          <Link
            className={OPERATOR_LINK.inline}
            href={record.href}
            data-testid="review-workspace-open-gate-return-resume-link"
          >
            {record.openGateLabel}
          </Link>
        </p>
      ) : null}
      <p className="m-0 mt-2">
        <Link
          className={OPERATOR_LINK.nav}
          href={REVIEW_WORKSPACE_OPEN_GATE_RETURN_HOME_HREF}
          data-testid="review-workspace-open-gate-return-home-link"
        >
          {REVIEW_WORKSPACE_OPEN_GATE_RETURN_HOME_LABEL}
        </Link>
      </p>
    </section>
  );
}
