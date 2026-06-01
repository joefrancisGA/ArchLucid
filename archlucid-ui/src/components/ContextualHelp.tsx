"use client";

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

import {
  contextualHelpByKey,
  contextualHelpTriggerAriaLabel,
  toDocsBlobUrl,
} from "@/lib/contextual-help-content";
import { cn } from "@/lib/utils";

export type ContextualHelpPlacement = "top" | "right" | "bottom" | "left";

export type ContextualHelpProps = {
  helpKey: string;
  placement?: ContextualHelpPlacement;
  /** Optional class on the trigger button wrapper. */
  className?: string;
};

const PANEL_GAP_PX = 6;

function computePanelStyle(trigger: HTMLElement, placement: ContextualHelpPlacement): CSSProperties {
  const rect = trigger.getBoundingClientRect();
  const baseStyle: CSSProperties = {
    position: "fixed",
    zIndex: 50,
    width: "16rem",
    maxWidth: "min(18rem, calc(100vw - 2rem))",
  };

  if (placement === "top") {
    return {
      ...baseStyle,
      top: rect.top - PANEL_GAP_PX,
      left: rect.left,
      transform: "translateY(-100%)",
    };
  }

  if (placement === "right") {
    return {
      ...baseStyle,
      top: rect.top,
      left: rect.right + PANEL_GAP_PX,
    };
  }

  if (placement === "left") {
    return {
      ...baseStyle,
      top: rect.top,
      left: rect.left - PANEL_GAP_PX,
      transform: "translateX(-100%)",
    };
  }

  return {
    ...baseStyle,
    top: rect.bottom + PANEL_GAP_PX,
    left: rect.left,
  };
}

/**
 * In-context help (not global Help). Pointer hover may preview the panel; click or Space/Enter toggles
 * a persistent open state until Escape or an outside pointer event. Keyboard users rely on the trigger
 * button only (no hover-only path). Panel uses `role="region"` (not `tooltip`) because copy may include a
 * focusable Learn more link. Content from `contextualHelpByKey` in `src/lib/contextual-help-content.ts`;
 * trigger `aria-label` from {@link contextualHelpTriggerAriaLabel}.
 */
export function ContextualHelp({ helpKey, placement = "bottom", className }: ContextualHelpProps) {
  const [open, setOpen] = useState(false);
  const [hover, setHover] = useState(false);
  const visible = open || hover;
  const rootId = useId();
  const panelId = `${rootId}-panel`;
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [panelStyle, setPanelStyle] = useState<CSSProperties | null>(null);
  const entry = contextualHelpByKey[helpKey];

  const close = useCallback(() => {
    setOpen(false);
    setHover(false);
  }, []);

  const updatePanelPosition = useCallback(() => {
    const trigger = triggerRef.current;

    if (trigger == null) {
      return;
    }

    setPanelStyle(computePanelStyle(trigger, placement));
  }, [placement]);

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

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        close();
        triggerRef.current?.focus();
      }
    };

    const onPointerDown = (e: PointerEvent) => {
      const t = e.target as Node;

      if (triggerRef.current?.contains(t) || panelRef.current?.contains(t)) {
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

  if (entry == null) {
    return null;
  }

  const { text, learnMoreUrl } = entry;
  const triggerAriaLabel = contextualHelpTriggerAriaLabel(helpKey);
  const moreHref = learnMoreUrl != null ? toDocsBlobUrl(learnMoreUrl) : null;

  const panel =
    visible && panelStyle != null ? (
      <div
        ref={panelRef}
        id={panelId}
        role="region"
        aria-label="Contextual help"
        style={panelStyle}
        className="rounded-md border border-neutral-200 bg-white px-3 py-2 text-left text-sm leading-snug text-neutral-800 shadow-md dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
      >
        <div className="m-0 text-xs text-neutral-700 dark:text-neutral-200">{text}</div>
        {moreHref != null && (
          <div className="m-0 mt-2 text-xs">
            <a
              className="font-medium text-teal-700 underline-offset-2 hover:underline dark:text-teal-300"
              href={moreHref}
              target="_blank"
              rel="noopener noreferrer"
            >
              Learn more →
            </a>
          </div>
        )}
      </div>
    ) : null;

  return (
    <>
      <span
        className={cn("relative inline-flex items-center", className)}
        onPointerEnter={() => {
          setHover(true);
        }}
        onPointerLeave={() => {
          setHover(false);
        }}
      >
        <button
          ref={triggerRef}
          type="button"
          className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-neutral-400 bg-white text-neutral-600 shadow-sm hover:border-teal-600 hover:text-teal-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-teal-600 dark:border-neutral-500 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:border-teal-500 dark:hover:text-teal-200"
          aria-expanded={visible}
          aria-controls={visible ? panelId : undefined}
          aria-describedby={visible ? panelId : undefined}
          aria-label={triggerAriaLabel ?? undefined}
          onClick={() => {
            setOpen((o) => !o);
          }}
          onKeyDown={(e) => {
            if (e.key === " " || e.key === "Enter") {
              e.preventDefault();
              setOpen((o) => !o);
            }
          }}
        >
          <CircleHelp className="h-3 w-3" aria-hidden />
        </button>
      </span>
      {panel != null && typeof document !== "undefined" ? createPortal(panel, document.body) : null}
    </>
  );
}
