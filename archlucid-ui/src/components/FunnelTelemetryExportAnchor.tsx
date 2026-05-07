"use client";

import type { AnchorHTMLAttributes, ReactNode } from "react";

import { recordFirstExportOpenedOnce } from "@/lib/first-tenant-funnel-telemetry";

/** Anchor that records first-tenant `first_export_opened` funnel telemetry (once per browser). */
export function FunnelTelemetryExportAnchor({
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
