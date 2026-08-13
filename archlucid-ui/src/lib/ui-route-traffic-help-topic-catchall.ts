import { HELP_TOPIC_CATCHALL_CANONICAL_PATH } from "@/lib/help/help-topic-catchall-evidence-copy";

/** Traffic workbook row ID for the help topic catch-all App Router dispatcher. Owner backlog shorthand: HE. */
export const HELP_TOPIC_CATCHALL_TRAFFIC_ROW_ID = "HE.";

/** Canonical path pattern tracked on the HE. workbook row. */
export const HELP_TOPIC_CATCHALL_TRAFFIC_PATH = HELP_TOPIC_CATCHALL_CANONICAL_PATH;

/**
 * Workbook Section column — App Router dispatch segment, not a buyer product topic.
 * Per-slug help rows own Evidence/UX scoring (TB-1602).
 */
export const HELP_TOPIC_CATCHALL_TRAFFIC_SECTION = "Router meta";

/**
 * Owner workbook Notes for HE. — documents router/dispatch hygiene only.
 * ASCII-only for Windows console note scripts.
 */
export const HELP_TOPIC_CATCHALL_TRAFFIC_NOTE =
  "Help topic catch-all dispatcher (Router meta; owner HE.) - App Router /help/[...topic] segment dispatches registry slugs to specialty guide views or enriched HelpTopicMarkdownView branches (TB-1601 inventory); not a standalone buyer URL or second product topic. Per-slug help workbook rows (HA, GO, HR, HFX, HAX, HPX, ...) own Evidence and UX scoring — score HE. for router/dispatch hygiene only (loading.tsx, fallthrough guard, specialty ladder). Sibling HEL = help hub; per-slug rows win on longer prefixes. Do not double-count catch-all traffic as product help Evidence (pairs TB-1493/IXX, TB-1443/AL2 redirect-only hygiene).";
