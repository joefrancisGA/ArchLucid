"use client";

import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { createPortal } from "react-dom";
import { CircleHelp } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { PageContextualHelpEntry } from "@/lib/contextual-help-registry";

export type PageScopedContextualHelpPanelProps = {
  readonly entry: PageContextualHelpEntry;
  readonly triggerLabel: string;
  readonly learnMoreHref?: string | null;
};

const PANEL_GAP_PX = 6;
const HOVER_CLOSE_GRACE_MS = 150;

function computePanelStyle(trigger: HTMLElement): CSSProperties {
  const rect = trigger.getBoundingClientRect();

  return {
    position: "fixed",
    zIndex: 50,
    top: rect.bottom + PANEL_GAP_PX,
    left: rect.left,
    width: "18rem",
    maxWidth: "min(20rem, calc(100vw - 2rem))",
  };
}

type HelpFieldProps = {
  readonly label: string;
  readonly body: string;
};

function HelpField({ label, body }: HelpFieldProps) {
  return (
    <div className="space-y-0.5">
      <p className={cn("m-0 font-medium text-neutral-800 dark:text-neutral-100", OPERATOR_TYPOGRAPHY.helper)}>
        {label}
      </p>
      <p className={cn("m-0 text-neutral-700 dark:text-neutral-200", OPERATOR_TYPOGRAPHY.helper)}>{body}</p>
    </div>
  );
}

/** Inline popover for page-scoped contextual help with an optional Learn more deep link. */
export function PageScopedContextualHelpPanel({
  entry,
  triggerLabel,
  learnMoreHref,
}: PageScopedContextualHelpPanelProps) {
  const [open, setOpen] = useState(false);
  const [hover, setHover] = useState(false);
  const visible = open || hover;
  const rootId = useId();
  const panelId = `${rootId}-panel`;
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const hoverCloseTimeoutRef = useRef<number | null>(null);
  const [panelStyle, setPanelStyle] = useState<CSSProperties | null>(null);

  const clearHoverCloseTimeout = useCallback(() => {
    if (hoverCloseTimeoutRef.current === null) {
      return;
    }

    window.clearTimeout(hoverCloseTimeoutRef.current);
    hoverCloseTimeoutRef.current = null;
  }, []);

  const close = useCallback(() => {
    clearHoverCloseTimeout();
    setOpen(false);
    setHover(false);
  }, [clearHoverCloseTimeout]);

  const handleHoverStart = useCallback(() => {
    clearHoverCloseTimeout();
    setHover(true);
  }, [clearHoverCloseTimeout]);

  const handleHoverEnd = useCallback(() => {
    clearHoverCloseTimeout();
    hoverCloseTimeoutRef.current = window.setTimeout(() => {
      setHover(false);
    }, HOVER_CLOSE_GRACE_MS);
  }, [clearHoverCloseTimeout]);

  useEffect(() => clearHoverCloseTimeout, [clearHoverCloseTimeout]);

  const updatePanelPosition = useCallback(() => {
    const trigger = triggerRef.current;

    if (trigger == null) {
      return;
    }

    setPanelStyle(computePanelStyle(trigger));
  }, []);

  useLayoutEffect(() => {
    if (!visible) {
      setPanelStyle(null);

      return;
    }

    updatePanelPosition();

    window.addEventListener("scroll", updatePanelPosition, true);
    window.addEventListener("resize", updatePanelPosition);

    return () => {
      window.removeEventListener("scroll", updatePanelPosition, true);
      window.removeEventListener("resize", updatePanelPosition);
    };
  }, [updatePanelPosition, visible]);

  useEffect(() => {
    if (!visible) {
      return;
    }

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        close();
        triggerRef.current?.focus();
      }
    };

    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;

      if (triggerRef.current?.contains(target) || panelRef.current?.contains(target)) {
        return;
      }

      close();
    };

    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointerDown, true);

    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointerDown, true);
    };
  }, [close, visible]);

  const panel =
    visible && panelStyle != null ? (
      <div
        ref={panelRef}
        id={panelId}
        role="region"
        aria-label="Page help"
        style={panelStyle}
        className={cn(
          "space-y-2 rounded-md border border-neutral-200 bg-white px-3 py-2 text-left shadow-md dark:border-neutral-700 dark:bg-neutral-900",
          OPERATOR_TYPOGRAPHY.body,
        )}
        onPointerEnter={handleHoverStart}
        onPointerLeave={handleHoverEnd}
        data-testid="page-scoped-contextual-help-panel"
      >
        <HelpField label="What is this page?" body={entry.whatIsThisPage} />
        <HelpField label="What to do next" body={entry.whatToDoNext} />

        {entry.whyEmpty != null ? <HelpField label="Why is this empty?" body={entry.whyEmpty} /> : null}

        {entry.whereToConfigurePrerequisite != null ? (
          <HelpField label="Where to configure" body={entry.whereToConfigurePrerequisite} />
        ) : null}

        {learnMoreHref != null ? (
          <p className={cn("m-0 pt-1", OPERATOR_TYPOGRAPHY.helper)}>
            <Link
              href={learnMoreHref}
              className="font-medium text-teal-700 underline-offset-2 hover:underline dark:text-teal-300"
              data-testid="page-scoped-contextual-help-learn-more"
            >
              Learn more →
            </Link>
          </p>
        ) : null}
      </div>
    ) : null;

  return (
    <>
      <span
        className="inline-flex items-center"
        onPointerEnter={handleHoverStart}
        onPointerLeave={handleHoverEnd}
      >
        <Button
          ref={triggerRef}
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 gap-1.5 px-2 text-neutral-700 dark:text-neutral-300"
          data-testid="page-contextual-help-button"
          aria-expanded={visible}
          aria-controls={visible ? panelId : undefined}
          aria-label={`Help: ${triggerLabel}`}
          title={`Help: ${triggerLabel}`}
          onClick={() => {
            setOpen((current) => !current);
          }}
          onKeyDown={(event) => {
            if (event.key === " " || event.key === "Enter") {
              event.preventDefault();
              setOpen((current) => !current);
            }
          }}
        >
          <CircleHelp className="h-4 w-4" aria-hidden />
          <span className={cn("font-medium", OPERATOR_TYPOGRAPHY.helper)}>{triggerLabel}</span>
        </Button>
      </span>
      {panel != null && typeof document !== "undefined" ? createPortal(panel, document.body) : null}
    </>
  );
}
