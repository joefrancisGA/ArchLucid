"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState, type SetStateAction } from "react";

import { InfrastructureAskClient } from "@/app/(operator)/governance/infrastructure/ask/InfrastructureAskClient";
import { HelpDrawerContent } from "@/components/help/HelpDrawerContent";
import { Dialog, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { useProductLine } from "@/components/product-line/ProductLineProvider";
import {
  INFRASTRUCTURE_ASK_OPEN_PARAM,
  infrastructureAskDrawerCloseHref,
  parseInfrastructureAskOpenFromSearch,
} from "@/lib/infra-evidence/infrastructure-ask-drawer-url";
import { isInfrastructureAskOverlayEligiblePath } from "@/lib/infra-evidence/infrastructure-ask-overlay-path";
import {
  GOVERNANCE_INFRASTRUCTURE_ASK_DRAWER_FULL_PAGE_ACTION,
  GOVERNANCE_INFRASTRUCTURE_ASK_DRAWER_LEAD,
  GOVERNANCE_INFRASTRUCTURE_ASK_PAGE_TITLE,
} from "@/lib/governance/governance-infrastructure-copy";
import { commitHrefIfChanged } from "@/lib/navigation/replace-if-href-changed";
import { infrastructureAskPathForProductLine } from "@/lib/product-line/securenow-infrastructure-routes";
import { cn } from "@/lib/utils";

/** Non-modal Infrastructure Ask drawer — keeps the workbench visible while asking grounded questions. */
export function InfrastructureAskDrawerHost() {
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();
  const { productLine } = useProductLine();
  const openFromUrl = parseInfrastructureAskOpenFromSearch(searchParams.get(INFRASTRUCTURE_ASK_OPEN_PARAM));
  const overlayEligible = isInfrastructureAskOverlayEligiblePath(pathname);
  const shouldBeOpen = overlayEligible && openFromUrl;
  const [open, setOpenState] = useState(shouldBeOpen);
  const openRef = useRef(open);

  openRef.current = open;

  const syncOpenToUrl = useCallback(
    (nextOpen: boolean) => {
      if (nextOpen) {
        const params = new URLSearchParams(searchParams.toString());

        params.set(INFRASTRUCTURE_ASK_OPEN_PARAM, "1");
        const nextQuery = params.toString();
        const nextHref = nextQuery.length > 0 ? `${pathname}?${nextQuery}` : pathname;

        commitHrefIfChanged(nextHref, { notify: false });
        return;
      }

      commitHrefIfChanged(
        infrastructureAskDrawerCloseHref(pathname, searchParams.toString()),
        { notify: false },
      );
    },
    [pathname, searchParams],
  );

  const setOpen = useCallback(
    (value: SetStateAction<boolean>) => {
      const next = typeof value === "function" ? value(openRef.current) : value;

      if (next === openRef.current) {
        return;
      }

      openRef.current = next;
      setOpenState(next);
      syncOpenToUrl(next);
    },
    [syncOpenToUrl],
  );

  useEffect(() => {
    if (openRef.current === shouldBeOpen) {
      return;
    }

    openRef.current = shouldBeOpen;
    setOpenState(shouldBeOpen);
  }, [shouldBeOpen]);

  useEffect(() => {
    const syncOpenFromPopstate = (): void => {
      const nextOpen =
        isInfrastructureAskOverlayEligiblePath(pathname)
        && parseInfrastructureAskOpenFromSearch(
          new URLSearchParams(window.location.search).get(INFRASTRUCTURE_ASK_OPEN_PARAM),
        );

      if (openRef.current === nextOpen) {
        return;
      }

      openRef.current = nextOpen;
      setOpenState(nextOpen);
    };

    syncOpenFromPopstate();
    window.addEventListener("popstate", syncOpenFromPopstate);

    return () => {
      window.removeEventListener("popstate", syncOpenFromPopstate);
    };
  }, [pathname]);

  const fullAskPageHref = useMemo(() => {
    const params = new URLSearchParams(searchParams.toString());

    params.delete(INFRASTRUCTURE_ASK_OPEN_PARAM);

    const askPath = infrastructureAskPathForProductLine(productLine);
    const nextQuery = params.toString();

    return nextQuery.length > 0 ? `${askPath}?${nextQuery}` : askPath;
  }, [productLine, searchParams]);

  if (!overlayEligible) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen} modal={false}>
      <HelpDrawerContent
        modal={false}
        className="z-[52] max-w-[min(100vw,40rem)]"
        closeAriaLabel="Close Infrastructure Ask"
        data-testid="infrastructure-ask-drawer"
        aria-label={GOVERNANCE_INFRASTRUCTURE_ASK_PAGE_TITLE}
        onPointerDownOutside={(event) => {
          event.preventDefault();
        }}
        onInteractOutside={(event) => {
          event.preventDefault();
        }}
      >
        <DialogHeader className="shrink-0 border-b border-neutral-200 px-4 py-3 pr-12 text-left dark:border-neutral-800">
          <DialogTitle className={cn("text-left text-al-text-primary", OPERATOR_TYPOGRAPHY.sectionTitle)}>
            {GOVERNANCE_INFRASTRUCTURE_ASK_PAGE_TITLE}
          </DialogTitle>
          <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
            {GOVERNANCE_INFRASTRUCTURE_ASK_DRAWER_LEAD}
          </p>
          <p className={cn("m-0 pt-1", OPERATOR_TYPOGRAPHY.helper)}>
            <Link className={OPERATOR_LINK.inline} href={fullAskPageHref} data-testid="infrastructure-ask-drawer-full-page">
              {GOVERNANCE_INFRASTRUCTURE_ASK_DRAWER_FULL_PAGE_ACTION}
            </Link>
          </p>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
          {open ? <InfrastructureAskClient presentation="drawer" /> : null}
        </div>
      </HelpDrawerContent>
    </Dialog>
  );
}
