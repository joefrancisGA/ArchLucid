"use client";

import { useEffect, useRef, type HTMLAttributes } from "react";

/**
 * Sets `data-app-ready="true"` after mount so screenshot/E2E can wait past React hydration
 * (marketing layout has no operator {@link AppShellClient} chrome).
 */
export function ShellReadySurface({ children, ...rest }: HTMLAttributes<HTMLDivElement>) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    ref.current?.setAttribute("data-app-ready", "true");
  }, []);

  return (
    <div ref={ref} {...rest}>
      {children}
    </div>
  );
}