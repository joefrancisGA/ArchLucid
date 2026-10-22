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
  /** Controlled open state; pair with {@link onOpenChange}. */
  readonly open?: boolean;
  readonly onOpenChange?: (open: boolean) => void;
  /** Keep body mounted but visually hidden when closed (find-in-page / print). */
  readonly mountBodyHiddenWhenClosed?: boolean;
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
    mountBodyHiddenWhenClosed = false,
    open: controlledOpen,
    onOpenChange,
  } = props;
  const detailsTestId = props["data-testid"];
  const controlled = controlledOpen !== undefined && onOpenChange !== undefined;
  const detailsRef = useRef<HTMLDetailsElement>(null);
  const suppressToggleHandlerRef = useRef(false);
  const mountedRef = useRef(false);
  const [contentMounted, setContentMounted] = useState(false);
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const detailsOpen = controlled ? controlledOpen === true : uncontrolledOpen;

  const mountBodyContent = (): void => {
    queueMicrotask(() => {
      if (mountedRef.current) {
        setContentMounted(true);
      }
    });
  };

  useEffect(() => {
    mountedRef.current = true;

    if (mountBodyHiddenWhenClosed) {
      mountBodyContent();
    }

    return () => {
      mountedRef.current = false;
    };
  }, [mountBodyHiddenWhenClosed]);

  useEffect(() => {
    if (controlled && controlledOpen) {
      mountBodyContent();
    }
  }, [controlled, controlledOpen]);

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
      if (controlled) {
        onOpenChange?.(true);
      } else {
        suppressToggleHandlerRef.current = true;
        details.open = true;
        suppressToggleHandlerRef.current = false;
      }
    }

    mountBodyContent();
  }, [controlled, mountOnHash, onOpenChange]);

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
      open={controlled ? controlledOpen : undefined}
      onToggle={(event) => {
        const nextOpen = event.currentTarget.open;

        if (controlled) {
          onOpenChange?.(nextOpen);

          if (nextOpen) {
            mountBodyContent();
          }

          return;
        }

        setUncontrolledOpen(nextOpen);

        if (suppressToggleHandlerRef.current || !nextOpen) {
          return;
        }

        mountBodyContent();
      }}
    >
      <summary className={summaryClassName}>{summary}</summary>
      {preface}
      {contentMounted ? (
        <div
          className={bodyClassName}
          data-testid={bodyTestId}
          hidden={mountBodyHiddenWhenClosed && !detailsOpen}
          aria-hidden={mountBodyHiddenWhenClosed && !detailsOpen ? true : undefined}
        >
          {children}
        </div>
      ) : null}
    </details>
  );
}
