"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

import { consumeRouteReferrer } from "@/lib/operator/operator-navigation-referrer";
import { trackRouteEntered } from "@/lib/operator/operator-navigation-telemetry";

/** Emits RouteEntered when the operator shell pathname changes (IA-019). */
export function OperatorRouteEnteredTelemetry() {
  const pathname = usePathname();
  const lastTrackedPathRef = useRef<string | null>(null);

  useEffect(() => {
    const path = pathname?.trim() ?? "";

    if (path.length === 0) {
      return;
    }

    if (lastTrackedPathRef.current === path) {
      return;
    }

    lastTrackedPathRef.current = path;

    trackRouteEntered({
      pathname: path,
      referrerType: consumeRouteReferrer(),
    });
  }, [pathname]);

  return null;
}
