"use client";

import { usePathname } from "next/navigation";

import { getLayerForRoute } from "@/lib/getLayerForRoute";

import { LayerContextStrip } from "./LayerContextStrip";

/** Client bridge: `usePathname()` → `getLayerForRoute()` → `LayerContextStrip` (App Router operator shell). */
export function LayerContextFromRoute() {
  const pathname = usePathname() ?? "/";

  // Home already carries pilot context in the hero; avoid a second mission strip that reads like a weak breadcrumb.
  if (pathname === "/") {
    return null;
  }

  return <LayerContextStrip layerId={getLayerForRoute(pathname)} />;
}
