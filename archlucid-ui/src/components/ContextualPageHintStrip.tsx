"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
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
      className="mb-3 flex flex-wrap items-start justify-between gap-2 rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-800 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200"
      data-testid="contextual-page-hint-strip"
      role="note"
    >
      <p className="m-0 max-w-prose">
        <span className="font-medium">What you can do here:</span> {hint.message}
        {hint.learnMoreHref !== undefined ? (
          <>
            {" "}
            <Link href={hint.learnMoreHref} className="font-medium text-teal-800 underline dark:text-teal-300">
              Learn more
            </Link>
          </>
        ) : null}
      </p>
      <Button type="button" variant="ghost" size="sm" className="h-7 shrink-0" onClick={onDismiss}>
        Dismiss
      </Button>
    </div>
  );
}
