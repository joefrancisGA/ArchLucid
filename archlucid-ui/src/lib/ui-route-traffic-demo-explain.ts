import { DEMO_EXPLAIN_CANONICAL_PATH } from "@/lib/demo-explain-evidence-copy";
import { DEMO_EXPLAIN_BUYER_SHELL_REDIRECT_HREF } from "@/lib/demo-explain-page-copy";

/** Traffic workbook row ID for internal demo explain tooling. Owner backlog shorthand: DEX. */
export const DEMO_EXPLAIN_TRAFFIC_ROW_ID = "DEX";

/** Canonical path tracked on the DEX workbook row. */
export const DEMO_EXPLAIN_TRAFFIC_PATH = DEMO_EXPLAIN_CANONICAL_PATH;

/** Workbook Section column — internal demo tooling, not buyer Learning traffic. */
export const DEMO_EXPLAIN_TRAFFIC_SECTION = "Internal";

/** Monthly share for buyer shells (always zero — route is internal-gated, IA-014). */
export const DEMO_EXPLAIN_TRAFFIC_MONTHLY_SHARE = "0";

/**
 * Owner workbook Notes for DEX — documents internal-only demo provenance tooling with zero buyer traffic weight.
 */
export const DEMO_EXPLAIN_TRAFFIC_NOTE =
  "Internal demo explain (Internal; traffic DEX) - DemoExplainPageView with PageContextualHelpButton (topic map evidence-trail; Category-1 registry), internal tooling orientation strip (full-operator shell), example provenance graph + citations-bound explanation. Buyer-polished shells redirect to /see-it (TB-1322 IA-014); never scored as buyer Learning traffic. Sibling WH = /why-archlucid; DPX = /demo/preview; DXX = /demo entry. Internal demo/proof orientation only - not Marketing or signed-record Sources trail. Owner pass: Evidence chrome shipped; cannot improve further toward 80 without turning this into a signed-record diligence Sources trail.";

/** Buyer-polished shell redirect documented in the DEX workbook row. */
export const DEMO_EXPLAIN_TRAFFIC_BUYER_SHELL_REDIRECT_PATH = DEMO_EXPLAIN_BUYER_SHELL_REDIRECT_HREF;
