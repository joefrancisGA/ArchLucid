"use client";

import Link from "next/link";
import { useState } from "react";

import { OperatorSectionLoadFailure } from "@/components/operator/OperatorSectionLoadFailure";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

type HelpTopicLoadFailureViewProps = {
  readonly topicTitle?: string;
  readonly topicSlug?: string;
};

function createHelpTopicFailureReference(topicSlug: string): string {
  const suffix = typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID().slice(0, 8)
    : Date.now().toString(36);

  return `help-${topicSlug}-${suffix}`;
}

export function HelpTopicLoadFailureView(props: HelpTopicLoadFailureViewProps = {}): React.ReactElement {
  const [referenceId] = useState(() => createHelpTopicFailureReference(props.topicSlug ?? "unknown"));
  const topicLabel = props.topicTitle ?? "This help topic";

  return (
    <div className="space-y-4" data-testid="help-topic-load-failure">
      <h1 className={cn("m-0", OPERATOR_TYPOGRAPHY.pageTitle)}>{topicLabel} unavailable</h1>
      <OperatorSectionLoadFailure
        message={`We could not load ${topicLabel}. The operator shell is available, but this topic request failed. Retry or report the reference ID below.`}
        onRetry={() => window.location.reload()}
        retryLabel="Reload page"
      />
      <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)} data-testid="help-topic-load-failure-reference">
        Reference ID: <code>{referenceId}</code>
      </p>
      <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)}>
        <Link href={`/help/report-a-problem?referenceId=${encodeURIComponent(referenceId)}`} className={OPERATOR_LINK.nav}>
          Report a problem
        </Link>
        {" · "}
        <Link href="/help" className={OPERATOR_LINK.nav}>
          Back to Help
        </Link>
      </p>
    </div>
  );
}
