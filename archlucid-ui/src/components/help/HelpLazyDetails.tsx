"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

export type HelpLazyDetailsProps = {
  readonly children: ReactNode;
  readonly summary: ReactNode;
  readonly className?: string;
  readonly summaryClassName?: string;
  readonly bodyClassName?: string;
  readonly preface?: ReactNode;
  readonly id?: string;
  readonly "data-testid"?: string;
  readonly bodyTestId?: string;
  /**
   * When the URL has a hash, open and mount immediately so clause/section deep links work.
   * Default true — SPA visits without a hash stay deferred (avoids Next Link Placement races).
   */
  readonly mountOnHash?: boolean;
};

/**
 * `<details>` that mounts children only after open (or when a hash deep-link needs them).
 * Eager markdown Links inside closed disclosures race Next Link `useOptimistic` during SPA nav.
 */
export function HelpLazyDetails(props: HelpLazyDetailsProps): React.ReactElement {
  const {
    children,
    summary,
    className,
    summaryClassName,
    bodyClassName,
    preface,
    id,
    bodyTestId,
    mountOnHash = true,
  } = props;
  const detailsTestId = props["data-testid"];
  const detailsRef = useRef<HTMLDetailsElement>(null);
  const suppressToggleHandlerRef = useRef(false);
  const mountedRef = useRef(false);
  const [contentMounted, setContentMounted] = useState(false);

  const mountBodyContent = (): void => {
    queueMicrotask(() => {
      if (mountedRef.current) {
        setContentMounted(true);
      }
    });
  };

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!mountOnHash) {
      return;
    }

    const hash = window.location.hash.replace(/^#/, "").trim();

    if (hash.length === 0) {
      return;
    }

    const details = detailsRef.current;

    if (details !== null) {
      suppressToggleHandlerRef.current = true;
      details.open = true;
      suppressToggleHandlerRef.current = false;
    }

    mountBodyContent();
  }, [mountOnHash]);

  useEffect(() => {
    function onHelpHashScroll(): void {
      const details = detailsRef.current;

      if (details !== null && details.open) {
        mountBodyContent();
      }
    }

    window.addEventListener("archlucid:help-hash-scroll", onHelpHashScroll);

    return () => {
      window.removeEventListener("archlucid:help-hash-scroll", onHelpHashScroll);
    };
  }, []);

  return (
    <details
      ref={detailsRef}
      id={id}
      className={className}
      data-testid={detailsTestId}
      onToggle={(event) => {
        if (suppressToggleHandlerRef.current || !event.currentTarget.open) {
          return;
        }

        mountBodyContent();
      }}
    >
      <summary className={summaryClassName}>{summary}</summary>
      {preface}
      {contentMounted ? (
        <div className={bodyClassName} data-testid={bodyTestId}>
          {children}
        </div>
      ) : null}
    </details>
  );
}
