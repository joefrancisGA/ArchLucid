"use client";
import { cn } from "@/lib/utils";
import { OPERATOR_BODY_INLINE_LINK_CLASS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { InlineGuidanceLabel } from "@/components/InlineGuidanceLabel";
import { DismissControl } from "@/components/usability/DismissControl";
import { pageContextualHintForPathname, pageHintDismissStorageKey } from "@/lib/page-contextual-hints";

/** Dismissible per-route hint strip — complements the Help drawer contextual copy. */
export function ContextualPageHintStrip(): React.JSX.Element | null {
  const pathname = usePathname() ?? "/";
  const hint = pageContextualHintForPathname(pathname);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (hint === null) {
      setVisible(false);

      return;
    }

    try {
      const dismissed = window.localStorage.getItem(pageHintDismissStorageKey(hint.id)) === "1";
      setVisible(!dismissed);
    }
    catch {
      setVisible(true);
    }
  }, [hint]);

  const onDismiss = useCallback(() => {
    if (hint === null) {
      return;
    }

    try {
      window.localStorage.setItem(pageHintDismissStorageKey(hint.id), "1");
    }
    catch {
      /* ignore */
    }

    setVisible(false);
  }, [hint]);

  if (hint === null || !visible) {
    return null;
  }

  return (
    <div
      className={cn("mb-3 flex flex-wrap items-start justify-between gap-2 rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2 text-neutral-800 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200", OPERATOR_TYPOGRAPHY.body)}
      data-testid="contextual-page-hint-strip"
      role="note"
    >
      <p className="m-0 max-w-prose">
        <InlineGuidanceLabel label="What you can do here:" testId="inline-guidance-what-you-can-do-here" />{" "}
        {hint.message}
        {hint.learnMoreHref !== undefined ? (
          <>
            {" "}
            <Link href={hint.learnMoreHref} className={OPERATOR_BODY_INLINE_LINK_CLASS}>
              Learn more
            </Link>
          </>
        ) : null}
      </p>
      <DismissControl className="h-7" onDismiss={onDismiss} />
    </div>
  );
}
