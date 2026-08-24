"use client";

import { CircleUser } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
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

import { Button } from "@/components/ui/button";
import { OPERATOR_SHELL_TOOLBAR_CONTROL_CLASS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { SELF_SETTINGS_DESTINATIONS } from "@/lib/self-settings-destinations";
import { OPERATOR_SHELL_GET_SUPPORT_MENU_ITEM } from "@/lib/operator/operator-shell-support-affordances";
import { cn } from "@/lib/utils";

export const ACCOUNT_SETTINGS_MENU_ARIA_LABEL = "Your account settings";

const PANEL_GAP_PX = 4;
const PANEL_MIN_EDGE_PX = 16;
const PANEL_WIDTH_PX = 288;

/** Fixed panel under the trigger — portaled so sticky top-bar overflow cannot trap a scrollbar. */
export function computeAccountSettingsMenuPanelStyle(trigger: HTMLElement): CSSProperties {
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

/**
 * Top-bar entry point for user-scoped settings.
 *
 * Deliberately ungated: every destination here writes only the signed-in caller's own record, so no
 * authority rank is consulted and the menu renders in every auth mode. Tenant-scoped settings are
 * published from the Administration settings hub instead.
 *
 * The panel is portaled to `document.body`. The shared Collapsible "Popover" is absolute and would
 * expand inside the sticky header's `overflow-x-hidden` (which forces `overflow-y: auto`) — a visible
 * scrollbar in the top bar that kills demos.
 */
export function AccountSettingsMenu(): React.JSX.Element {
  const [open, setOpen] = useState(false);
  const [panelStyle, setPanelStyle] = useState<CSSProperties | null>(null);
  const pathname = usePathname();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const panelId = useId();

  const closeMenu = useCallback(() => {
    setOpen(false);
  }, []);

  const syncPanelPosition = useCallback(() => {
    const trigger = triggerRef.current;

    if (trigger === null) {
      return;
    }

    setPanelStyle(computeAccountSettingsMenuPanelStyle(trigger));
  }, []);

  useLayoutEffect(() => {
    if (!open) {
      setPanelStyle(null);

      return;
    }

    syncPanelPosition();
  }, [open, syncPanelPosition]);

  useEffect(() => {
    if (!open) {
      return;
    }

    function onKeyDown(event: KeyboardEvent): void {
      if (event.key === "Escape") {
        closeMenu();
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

      closeMenu();
    }

    function onViewportChange(): void {
      syncPanelPosition();
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
  }, [closeMenu, open, syncPanelPosition]);

  const panel =
    open && panelStyle !== null ? (
      <div
        ref={panelRef}
        id={panelId}
        role="menu"
        data-testid="account-settings-menu"
        aria-label={ACCOUNT_SETTINGS_MENU_ARIA_LABEL}
        style={panelStyle}
        className="rounded-lg border border-neutral-200 bg-white p-2 shadow-md dark:border-neutral-700 dark:bg-neutral-900"
      >
        <ul className="m-0 list-none space-y-1 p-0">
          {SELF_SETTINGS_DESTINATIONS.map((destination) => {
            const isCurrent = pathname === destination.href;

            return (
              <li key={destination.id} className="m-0" role="none">
                <Link
                  href={destination.href}
                  role="menuitem"
                  aria-current={isCurrent ? "page" : undefined}
                  data-testid={`account-settings-menu-item-${destination.id}`}
                  onClick={closeMenu}
                  className={cn(
                    "block rounded-md px-2 py-1.5 no-underline hover:bg-neutral-100 dark:hover:bg-neutral-800",
                    isCurrent ? "bg-neutral-100 dark:bg-neutral-800" : undefined,
                  )}
                >
                  <span className={cn("block font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
                    {destination.title}
                  </span>
                  <span className={cn("block text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                    {destination.description}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
        <div className="my-2 border-t border-neutral-200 dark:border-neutral-700" role="separator" />
        <ul className="m-0 list-none space-y-1 p-0">
          <li className="m-0" role="none">
            <Link
              href={OPERATOR_SHELL_GET_SUPPORT_MENU_ITEM.href}
              role="menuitem"
              aria-current={pathname === OPERATOR_SHELL_GET_SUPPORT_MENU_ITEM.href ? "page" : undefined}
              data-testid={`account-settings-menu-item-${OPERATOR_SHELL_GET_SUPPORT_MENU_ITEM.id}`}
              onClick={closeMenu}
              className={cn(
                "block rounded-md px-2 py-1.5 no-underline hover:bg-neutral-100 dark:hover:bg-neutral-800",
                pathname === OPERATOR_SHELL_GET_SUPPORT_MENU_ITEM.href
                  ? "bg-neutral-100 dark:bg-neutral-800"
                  : undefined,
              )}
            >
              <span className={cn("block font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
                {OPERATOR_SHELL_GET_SUPPORT_MENU_ITEM.title}
              </span>
              <span className={cn("block text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                {OPERATOR_SHELL_GET_SUPPORT_MENU_ITEM.description}
              </span>
            </Link>
          </li>
        </ul>
      </div>
    ) : null;

  return (
    <>
      <Button
        ref={triggerRef}
        type="button"
        variant="outline"
        size="sm"
        className={cn("inline-flex w-8 items-center justify-center p-0", OPERATOR_SHELL_TOOLBAR_CONTROL_CLASS)}
        data-testid="account-settings-menu-trigger"
        aria-label={ACCOUNT_SETTINGS_MENU_ARIA_LABEL}
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        aria-haspopup="menu"
        onClick={() => {
          setOpen((current) => !current);
        }}
      >
        <CircleUser className="size-[18px]" aria-hidden />
      </Button>
      {panel !== null && typeof document !== "undefined" ? createPortal(panel, document.body) : null}
    </>
  );
}
