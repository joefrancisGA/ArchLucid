import type { Metadata } from "next";

import {
  EVIDENCE_GRAPH_PAGE_SUBTITLE,
  EVIDENCE_GRAPH_PAGE_TITLE,
} from "@/lib/evidence-graph-page";

/**
 * Canonical evidence graph operator surface — not a marketing landing page.
 */
export const EVIDENCE_GRAPH_ROUTE_METADATA: Metadata = {
  title: EVIDENCE_GRAPH_PAGE_TITLE,
  description: EVIDENCE_GRAPH_PAGE_SUBTITLE,
  robots: { index: false, follow: false },
};
