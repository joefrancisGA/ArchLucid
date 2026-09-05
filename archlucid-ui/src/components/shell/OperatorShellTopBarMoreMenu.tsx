"use client";

import { MoreHorizontal } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
  type SetStateAction,
} from "react";
import { createPortal } from "react-dom";

import { Button } from "@/components/ui/button";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  parseShellTopBarMoreOpenFromSearch,
  shellTopBarMoreMenuHrefFromSearch,
} from "@/lib/operator/shell-top-bar-more-menu-url";
import { cn } from "@/lib/utils";

const PANEL_GAP_PX = 4;
const PANEL_MIN_EDGE_PX = 16;
const PANEL_WIDTH_PX = 220;

export const OPERATOR_SHELL_TOP_BAR_MORE_ARIA_LABEL = "More shell tools";

function computePanelStyle(trigger: HTMLElement): CSSProperties {
  const rect = trigger.getBoundingClientRect();
  const width = Math.min(PANEL_WIDTH_PX, window.innerWidth - PANEL_MIN_EDGE_PX * 2);
  const left = Math.max(PANEL_MIN_EDGE_PX, rect.right - width);

  return {
    position: "fixed",
    zIndex: 100,
    top: rect.bottom + PANEL_GAP_PX,
    left,
    width,
  };
}

type OperatorShellTopBarMoreMenuProps = {
  readonly children: ReactNode;
};

/**
 * Portaled overflow for eval-only secondary top-bar tools (authority theme toggle)
 * so the sticky header stays a single row. Help stays freestanding; the AI budget
 * pill (warn/critical only) also stays freestanding — do not park them here.
 */
export function OperatorShellTopBarMoreMenu(props: OperatorShellTopBarMoreMenuProps): React.JSX.Element {
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();
  const shellMoreOpenParam = searchParams.get("shellMoreOpen");
  const [open, setOpenState] = useState(() => parseShellTopBarMoreOpenFromSearch(shellMoreOpenParam));
  const [panelStyle, setPanelStyle] = useState<CSSProperties | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const panelId = useId();

  const syncShellMoreOpenToUrl = useCallback(
    (menuOpen: boolean) => {
      router.replace(shellTopBarMoreMenuHrefFromSearch(searchParams.toString(), menuOpen, pathname), {
        scroll: false,
      });
    },
    [pathname, router, searchParams],
  );

  const setOpen = useCallback(
    (value: SetStateAction<boolean>) => {
      setOpenState((current) => {
        const next = typeof value === "function" ? value(current) : value;
        syncShellMoreOpenToUrl(next);

        return next;
      });
    },
    [syncShellMoreOpenToUrl],
  );

  const close = useCallback(() => {
    setOpen(false);
  }, [setOpen]);

  const syncPosition = useCallback(() => {
    const trigger = triggerRef.current;

    if (trigger === null) {
      return;
    }

    setPanelStyle(computePanelStyle(trigger));
  }, []);

  useLayoutEffect(() => {
    if (!open) {
      setPanelStyle(null);

      return;
    }

    syncPosition();
  }, [open, syncPosition]);

  useEffect(() => {
    if (!open) {
      return;
    }

    function onKeyDown(event: KeyboardEvent): void {
      if (event.key === "Escape") {
        close();
      }
    }

    function onPointerDown(event: PointerEvent): void {
      const target = event.target;

      if (!(target instanceof Node)) {
        return;
      }

      if (triggerRef.current?.contains(target) === true) {
        return;
      }

      if (panelRef.current?.contains(target) === true) {
        return;
      }

      close();
    }

    function onViewportChange(): void {
      syncPosition();
    }

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown, true);
    window.addEventListener("resize", onViewportChange);
    window.addEventListener("scroll", onViewportChange, true);

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown, true);
      window.removeEventListener("resize", onViewportChange);
      window.removeEventListener("scroll", onViewportChange, true);
    };
  }, [close, open, syncPosition]);

  const panel =
    open && panelStyle !== null ? (
      <div
        ref={panelRef}
        id={panelId}
        role="menu"
        data-testid="operator-shell-topbar-more-menu"
        aria-label={OPERATOR_SHELL_TOP_BAR_MORE_ARIA_LABEL}
        style={panelStyle}
        className="flex flex-col gap-2 rounded-lg border border-neutral-200 bg-white p-2 shadow-md dark:border-neutral-700 dark:bg-neutral-900"
      >
        {props.children}
      </div>
    ) : null;

  return (
    <>
      <Button
        ref={triggerRef}
        type="button"
        variant="outline"
        size="sm"
        className="inline-flex h-7 w-7 items-center justify-center p-0"
        data-testid="operator-shell-topbar-more-trigger"
        aria-label={OPERATOR_SHELL_TOP_BAR_MORE_ARIA_LABEL}
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        aria-haspopup="menu"
        onClick={() => {
          setOpen((current) => !current);
        }}
      >
        <MoreHorizontal className="size-[18px]" aria-hidden />
        <span className={cn("sr-only", OPERATOR_TYPOGRAPHY.helper)}>More</span>
      </Button>
      {panel !== null && typeof document !== "undefined" ? createPortal(panel, document.body) : null}
    </>
  );
}
