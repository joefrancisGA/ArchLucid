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
  const [contentMounted, setContentMounted] = useState(false);

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
      details.open = true;
    }

    setContentMounted(true);
  }, [mountOnHash]);

  return (
    <details
      ref={detailsRef}
      id={id}
      className={className}
      data-testid={detailsTestId}
      onToggle={(event) => {
        if (event.currentTarget.open) {
          setContentMounted(true);
        }
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
