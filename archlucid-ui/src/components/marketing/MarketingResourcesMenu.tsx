"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { SEE_IT_PAGE_TITLE } from "@/lib/see-it-page-copy";
import { MARKETING_CANONICAL_DEMO_PATH } from "@/lib/marketing/marketing-entry-spine";
import { MARKETING_PUBLIC_NAV_LINK_CLASS } from "@/lib/marketing-public-nav-link-class";
import { cn } from "@/lib/utils";

const resourcesMenuId = "marketing-resources-menu";

type MarketingResourcesMenuProps = {
  seeItLinked: boolean;
};

export function MarketingResourcesMenu({ seeItLinked }: MarketingResourcesMenuProps) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    function closeWhenClickingOutside(event: PointerEvent) {
      const targetNode = event.target instanceof Node ? event.target : null;

      if (targetNode === null || menuRef.current?.contains(targetNode)) {
        return;
      }

      setOpen(false);
    }

    function closeWhenFocusLeaves(event: FocusEvent) {
      const targetNode = event.target instanceof Node ? event.target : null;

      if (targetNode === null || menuRef.current?.contains(targetNode)) {
        return;
      }

      setOpen(false);
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key !== "Escape") {
        return;
      }

      setOpen(false);
    }

    document.addEventListener("pointerdown", closeWhenClickingOutside);
    document.addEventListener("focusin", closeWhenFocusLeaves);
    document.addEventListener("keydown", closeOnEscape);

    return () => {
      document.removeEventListener("pointerdown", closeWhenClickingOutside);
      document.removeEventListener("focusin", closeWhenFocusLeaves);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  function closeMenu() {
    setOpen(false);
  }

  function toggleMenu() {
    setOpen((currentOpen) => !currentOpen);
  }

  return (
    <div ref={menuRef} className="relative shrink-0">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={resourcesMenuId}
        aria-haspopup="menu"
        className={cn(MARKETING_PUBLIC_NAV_LINK_CLASS, "cursor-pointer border-0 bg-transparent")}
        onClick={toggleMenu}
      >
        Resources
        <span className="ml-0.5 text-neutral-400" aria-hidden>
          ▾
        </span>
      </button>
      {open ? (
        <div
          id={resourcesMenuId}
          role="menu"
          className="absolute end-0 top-full z-50 mt-1 min-w-[14rem] rounded-md border border-neutral-200 bg-white py-1 shadow-lg dark:border-neutral-700 dark:bg-neutral-950"
        >
          <Link
            href="/faq"
            role="menuitem"
            className={cn(
              "block px-3 py-2 font-medium text-neutral-900 hover:bg-neutral-50 dark:text-neutral-100 dark:hover:bg-neutral-900",
              OPERATOR_TYPOGRAPHY.body,
            )}
            onClick={closeMenu}
          >
            Product FAQ
          </Link>
          <Link
            href="/compliance-journey"
            role="menuitem"
            className={cn(
              "block px-3 py-2 text-neutral-800 hover:bg-neutral-50 dark:text-neutral-200 dark:hover:bg-neutral-900",
              OPERATOR_TYPOGRAPHY.body,
            )}
            onClick={closeMenu}
          >
            Compliance journey
          </Link>
          <Link
            href="/trust"
            role="menuitem"
            className={cn(
              "block px-3 py-2 text-neutral-800 hover:bg-neutral-50 dark:text-neutral-200 dark:hover:bg-neutral-900",
              OPERATOR_TYPOGRAPHY.body,
            )}
            onClick={closeMenu}
          >
            Trust Center
          </Link>
          <Link
            href="/security-trust"
            role="menuitem"
            className={cn(
              "block px-3 py-2 text-neutral-800 hover:bg-neutral-50 dark:text-neutral-200 dark:hover:bg-neutral-900",
              OPERATOR_TYPOGRAPHY.body,
            )}
            onClick={closeMenu}
          >
            Assurance status
          </Link>
          <Link
            href="/privacy"
            role="menuitem"
            className={cn(
              "block px-3 py-2 text-neutral-800 hover:bg-neutral-50 dark:text-neutral-200 dark:hover:bg-neutral-900",
              OPERATOR_TYPOGRAPHY.body,
            )}
            onClick={closeMenu}
          >
            Privacy policy
          </Link>
          <Link
            href="/why"
            role="menuitem"
            className={cn(
              "block px-3 py-2 text-neutral-800 hover:bg-neutral-50 dark:text-neutral-200 dark:hover:bg-neutral-900",
              OPERATOR_TYPOGRAPHY.body,
            )}
            onClick={closeMenu}
          >
            Why ArchLucid
          </Link>
          {seeItLinked ? (
            <Link
              href={MARKETING_CANONICAL_DEMO_PATH}
              role="menuitem"
              className={cn(
                "block px-3 py-2 text-neutral-800 hover:bg-neutral-50 dark:text-neutral-200 dark:hover:bg-neutral-900",
                OPERATOR_TYPOGRAPHY.body,
              )}
              onClick={closeMenu}
            >
              {SEE_IT_PAGE_TITLE}
            </Link>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
