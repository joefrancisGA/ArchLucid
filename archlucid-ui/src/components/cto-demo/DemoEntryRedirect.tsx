"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { DEMO_ENTRY_REDIRECTING_LABEL } from "@/lib/demo-entry-evidence-copy";
import { resolveDemoEntryRedirectHref } from "@/lib/demo-entry-redirect";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

/**
 * Client redirect for `/demo` — avoids Next.js dev RSC performance `measure` errors when a server
 * page calls `redirect()` before component timing marks complete.
 * Shows interim Sources chrome while the replace runs.
 */
export function DemoEntryRedirect() {
  const [targetHref, setTargetHref] = useState("/");

  useEffect(() => {
    const href = resolveDemoEntryRedirectHref();
    setTargetHref(href);
    window.location.replace(href);
  }, []);

  return (
    <div
      className="mx-auto w-full max-w-3xl space-y-6 px-4 py-10 sm:px-6"
      data-testid="demo-entry-redirect"
    >
      <header className="space-y-2">
        <h1 className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.pageTitle)}>Demo entry</h1>
        <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)} data-testid="demo-entry-redirecting">
          {DEMO_ENTRY_REDIRECTING_LABEL}
        </p>
        <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>
          If nothing happens,{" "}
          <Link className={OPERATOR_LINK.inline} href={targetHref} data-testid="demo-entry-continue">
            continue to the demo
          </Link>
          .
        </p>
      </header>
</div>
  );
}
