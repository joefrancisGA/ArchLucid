import type { Metadata } from "next";

import { OperatorClientDrivenRouteLayout } from "@/lib/next/operator-client-driven-route-layout";

export const metadata: Metadata = {
  title: "Finalized review record",
};

/** Invalid manifest ids fail in `page.tsx` so segment `not-found.tsx` renders with branded recovery chrome. */
export default OperatorClientDrivenRouteLayout;
