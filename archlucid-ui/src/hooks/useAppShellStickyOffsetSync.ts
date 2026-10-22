"use client";

import { useLayoutEffect, type RefObject } from "react";

const APP_SHELL_STICKY_CSS_VAR = "--app-shell-sticky";

/**
 * Publishes the measured sticky shell header height as `--app-shell-sticky` on `:root`
 * so hash links, scroll-padding, and sticky in-page nav respect the real header stack.
 */
export function useAppShellStickyOffsetSync(stickyHeaderRef: RefObject<HTMLElement | null>): void {
  useLayoutEffect(() => {
    const element = stickyHeaderRef.current;

    if (element === null) {
      return;
    }

    const root = document.documentElement;

    const apply = (): void => {
      const height = element.getBoundingClientRect().height;

      if (height > 0) {
        root.style.setProperty(APP_SHELL_STICKY_CSS_VAR, `${Math.ceil(height)}px`);
      }
    };

    apply();

    const observer = new ResizeObserver(apply);
    observer.observe(element);

    return () => {
      observer.disconnect();
      root.style.removeProperty(APP_SHELL_STICKY_CSS_VAR);
    };
  }, [stickyHeaderRef]);
}
