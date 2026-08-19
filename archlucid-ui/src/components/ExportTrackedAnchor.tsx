"use client";

import type { AnchorHTMLAttributes, ReactNode } from "react";

import { recordFirstExportOpenedOnce } from "@/lib/first-tenant-funnel-telemetry";

/**
 * Download/export anchor that records a single first-export lifecycle event (once per browser).
 * Used for onboarding completion signals only — not persistent export surveillance or marketing analytics.
 */
export function ExportTrackedAnchor({
  onClick,
  children,
  ...props
}: Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "children"> & { children: ReactNode }) {
  return (
    <a
      {...props}
      onClick={(e) => {
        recordFirstExportOpenedOnce();
        onClick?.(e);
      }}
    >
      {children}
    </a>
  );
}
