"use client";

import Link from "next/link";

import {
  OPERATOR_LINK,
  OPERATOR_TYPOGRAPHY,
} from "@/lib/design-tokens";
import { INTEGRATIONS_READINESS_PATH } from "@/lib/integrations-nav-paths";
import {
  SLACK_INTEGRATION_SECURITY_NOTE,
} from "@/lib/slack-integration-page-copy";
import { cn } from "@/lib/utils";
/** Compact setup guidance beside the Slack destination form. */
export function SlackIntegrationAside(): React.ReactElement {
  return (
    <aside className="space-y-4" data-testid="slack-integration-aside">
<div className="rounded-md border border-neutral-200 bg-al-surface-raised p-4 dark:border-neutral-800">
        <h2 className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}>Security</h2>
        <p className={cn("m-0 mt-2 leading-relaxed text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
          {SLACK_INTEGRATION_SECURITY_NOTE}
        </p>
      </div>

      <p className={cn("m-0 leading-relaxed text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
        Review connector status on{" "}
        <Link className={OPERATOR_LINK.inline} href={INTEGRATIONS_READINESS_PATH}>
          Integration readiness
        </Link>
        .
      </p>
    </aside>
  );
}
