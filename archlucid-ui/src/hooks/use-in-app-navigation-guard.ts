"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import {
  livelihoodDocumentGuardHrefFromSearch,
  parseLivelihoodDocumentGuardOpenFromSearch,
} from "@/lib/operator/livelihood-document-guard-url";

type PendingNavigation = {
  readonly href: string;
  readonly kind: "link" | "back";
};

export type UseInAppNavigationGuardArgs = {
  readonly when: boolean;
  readonly message?: string;
};

function isSameDocumentPath(href: string): boolean {
  const current = `${window.location.pathname}${window.location.search}`;

  return href === current;
}

function isInternalAppHref(href: string): boolean {
  if (!href.startsWith("/")) {
    return false;
  }

  if (href.startsWith("//")) {
    return false;
  }

  return true;
}

/** Blocks same-app link navigation when draft edits may be lost (tab close uses beforeunload). */
export function useInAppNavigationGuard(args: UseInAppNavigationGuardArgs) {
  const router = useRouter();
  const pathname = usePathname() ?? "";
  const searchParams = useSearchParams();
  const navGuardOpenParam = searchParams.get("navGuardOpen");
  const [pendingNavigation, setPendingNavigation] = useState<PendingNavigation | null>(null);
  const allowNavigationRef = useRef(false);

  const dialogMessage = args.message ?? "You have unsaved architecture changes.";

  const syncNavGuardOpenToUrl = useCallback(
    (guardOpen: boolean) => {
      router.replace(
        livelihoodDocumentGuardHrefFromSearch(searchParams.toString(), guardOpen, pathname),
        { scroll: false },
      );
    },
    [pathname, router, searchParams],
  );

  const cancelLeave = useCallback(() => {
    setPendingNavigation(null);
    syncNavGuardOpenToUrl(false);
  }, [syncNavGuardOpenToUrl]);

  const confirmLeave = useCallback(() => {
    if (pendingNavigation === null) {
      return;
    }

    allowNavigationRef.current = true;
    syncNavGuardOpenToUrl(false);

    if (pendingNavigation.kind === "back") {
      window.history.back();
    } else {
      window.location.assign(pendingNavigation.href);
    }

    setPendingNavigation(null);
  }, [pendingNavigation, syncNavGuardOpenToUrl]);

  useEffect(() => {
    const dialogOpen = pendingNavigation !== null;
    const urlGuardOpen = parseLivelihoodDocumentGuardOpenFromSearch(navGuardOpenParam);

    if (dialogOpen === urlGuardOpen) {
      return;
    }

    syncNavGuardOpenToUrl(dialogOpen);
  }, [navGuardOpenParam, pendingNavigation, syncNavGuardOpenToUrl]);

  useEffect(() => {
    if (!args.when) {
      return;
    }

    function onDocumentClick(event: MouseEvent) {
      if (allowNavigationRef.current) {
        allowNavigationRef.current = false;

        return;
      }

      const target = event.target;

      if (target === null || !(target instanceof Element)) {
        return;
      }

      const anchor = target.closest("a[href]");

      if (anchor === null || !(anchor instanceof HTMLAnchorElement)) {
        return;
      }

      if (anchor.target === "_blank" || anchor.hasAttribute("download")) {
        return;
      }

      const href = anchor.getAttribute("href") ?? "";

      if (!isInternalAppHref(href) || href.startsWith("#")) {
        return;
      }

      if (isSameDocumentPath(href)) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      setPendingNavigation({ href, kind: "link" });
    }

    function onPopState() {
      if (allowNavigationRef.current) {
        allowNavigationRef.current = false;

        return;
      }

      window.history.pushState(null, "", window.location.href);
      setPendingNavigation({ href: "", kind: "back" });
    }

    window.history.pushState(null, "", window.location.href);
    document.addEventListener("click", onDocumentClick, true);
    window.addEventListener("popstate", onPopState);

    return () => {
      document.removeEventListener("click", onDocumentClick, true);
      window.removeEventListener("popstate", onPopState);
    };
  }, [args.when]);

  return {
    pendingNavigation,
    confirmLeave,
    cancelLeave,
    dialogMessage,
    dialogOpen: pendingNavigation !== null,
  };
}
