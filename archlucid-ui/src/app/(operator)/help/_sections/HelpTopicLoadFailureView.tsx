"use client";

import Link from "next/link";

import { OperatorSectionLoadFailure } from "@/components/operator/OperatorSectionLoadFailure";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export function HelpTopicLoadFailureView(): React.ReactElement {
  return (
    <div className="space-y-4" data-testid="help-topic-load-failure">
      <OperatorSectionLoadFailure
        message="We could not load this help topic right now. Check your connection and try again."
        onRetry={() => window.location.reload()}
        retryLabel="Reload page"
      />
      <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)}>
        <Link href="/help" className={OPERATOR_LINK.nav}>
          Back to Help
        </Link>
      </p>
    </div>
  );
}
