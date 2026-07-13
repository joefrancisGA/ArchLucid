"use client";

import { cn } from "@/lib/utils";

import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  WEBHOOKS_ABOUT_DEVELOPERS,
  WEBHOOKS_ABOUT_SECURITY,
  WEBHOOKS_ABOUT_WHAT_WE_SEND,
  WEBHOOKS_ABOUT_WHEN_TO_USE,
} from "@/lib/webhooks-page-copy";

export function WebhooksAboutPanel(): React.JSX.Element {
  return (
    <aside
      className="rounded-lg border border-neutral-200 bg-neutral-50/70 p-4 dark:border-neutral-700 dark:bg-neutral-900/30"
      aria-labelledby="webhooks-about-heading"
      data-testid="webhooks-about-panel"
    >
      <h2 id="webhooks-about-heading" className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}>
        About webhooks
      </h2>
      <dl className={cn("m-0 mt-3 space-y-3", OPERATOR_TYPOGRAPHY.body)}>
        <div>
          <dt className="font-medium text-al-text-primary">When to use</dt>
          <dd className="m-0 mt-1 text-al-text-secondary">{WEBHOOKS_ABOUT_WHEN_TO_USE}</dd>
        </div>
        <div>
          <dt className="font-medium text-al-text-primary">What ArchLucid sends</dt>
          <dd className="m-0 mt-1 text-al-text-secondary">{WEBHOOKS_ABOUT_WHAT_WE_SEND}</dd>
        </div>
        <div>
          <dt className="font-medium text-al-text-primary">How delivery is secured</dt>
          <dd className="m-0 mt-1 text-al-text-secondary">{WEBHOOKS_ABOUT_SECURITY}</dd>
        </div>
        <div>
          <dt className="font-medium text-al-text-primary">For developers</dt>
          <dd className="m-0 mt-1 text-al-text-secondary">{WEBHOOKS_ABOUT_DEVELOPERS}</dd>
        </div>
      </dl>
    </aside>
  );
}
