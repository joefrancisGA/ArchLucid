"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import {
  isAllowedProgrammaticNavigation,
  isInternalAppHref,
  isSameDocumentPath,
} from "@/lib/in-app-navigation-guard-helpers";
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

function resolveNavigationHref(href: string): string {
  if (href.startsWith("/")) {
    return href;
  }

  const url = new URL(href, window.location.origin);

  return `${url.pathname}${url.search}`;
}

/** Blocks same-app link navigation when draft edits may be lost (tab close uses beforeunload). */
export function useInAppNavigationGuard(args: UseInAppNavigationGuardArgs) {
  const router = useRouter();
  const pathname = usePathname() ?? "";
  const searchParams = useSearchParams();
  const navGuardOpenParam = searchParams.get("navGuardOpen");
  const [pendingNavigation, setPendingNavigation] = useState<PendingNavigation | null>(null);
  const allowNavigationRef = useRef(false);
  const routerRef = useRef(router);

  routerRef.current = router;

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

    const activeRouter = routerRef.current;
    const originalPush = activeRouter.push.bind(activeRouter);
    const originalReplace = activeRouter.replace.bind(activeRouter);

    function interceptNavigation(
      href: string,
      navigate: (nextHref: string, options?: { scroll?: boolean }) => void,
      options?: { scroll?: boolean },
    ): void {
      if (allowNavigationRef.current) {
        allowNavigationRef.current = false;
        navigate(href, options);

        return;
      }

      const resolvedHref = resolveNavigationHref(href);

      if (!isInternalAppHref(resolvedHref) || isAllowedProgrammaticNavigation(resolvedHref)) {
        navigate(href, options);

        return;
      }

      setPendingNavigation({ href: resolvedHref, kind: "link" });
    }

    activeRouter.push = ((href: string, options?: { scroll?: boolean }) => {
      interceptNavigation(href, originalPush, options);
    }) as typeof activeRouter.push;

    activeRouter.replace = ((href: string, options?: { scroll?: boolean }) => {
      interceptNavigation(href, originalReplace, options);
    }) as typeof activeRouter.replace;

    return () => {
      activeRouter.push = originalPush;
      activeRouter.replace = originalReplace;
    };
  }, [args.when]);

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
