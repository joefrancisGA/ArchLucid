"use client";

import Link from "next/link";

import {
  CLOUD_CONNECTIONS_PLATFORM_SCOPE_PREFERENCES_HREF,
  CLOUD_CONNECTIONS_PLATFORM_SCOPE_PREFERENCES_LINK_LABEL,
  CLOUD_CONNECTIONS_PLATFORM_SCOPE_PREFERENCES_NOTICE_PREFIX,
} from "@/lib/cloud-platform-scope-copy";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export function CloudPlatformScopePreferencesNotice() {
  return (
    <p
      className={cn(
        "m-0 rounded-md border border-neutral-200 bg-neutral-50/70 p-4 text-al-text-secondary dark:border-neutral-800 dark:bg-neutral-900/40",
        OPERATOR_TYPOGRAPHY.helper,
      )}
      data-testid="cloud-platform-scope-preferences-notice"
    >
      {CLOUD_CONNECTIONS_PLATFORM_SCOPE_PREFERENCES_NOTICE_PREFIX}{" "}
      <Link
        href={CLOUD_CONNECTIONS_PLATFORM_SCOPE_PREFERENCES_HREF}
        className={cn(OPERATOR_LINK.inline, "font-medium")}
        data-testid="cloud-platform-scope-preferences-link"
      >
        {CLOUD_CONNECTIONS_PLATFORM_SCOPE_PREFERENCES_LINK_LABEL}
      </Link>
      .
    </p>
  );
}
