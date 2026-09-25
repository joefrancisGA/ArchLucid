import type { HelpMarkdownHeading } from "@/lib/help/help-markdown-headings";
import {
  DAYTIME_WAIT_ADR_0096_RELATIVE_PATH,
  DAYTIME_WAIT_FORBIDDEN_RUN_PROGRESS_URL_FRAGMENT,
} from "@/lib/daytime-wait-adr-inventory";
import { DAYTIME_WAIT_FORBIDDEN_PERCENT_COMPLETE_PROPERTY } from "@/lib/daytime-wait-no-fake-percent-complete-ratchet";
import { DAYTIME_WAIT_HELP_BACKGROUND_WAIT_PATH } from "@/lib/daytime-wait-help-background-wait-route";
import { DAYTIME_WAIT_HELP_PROXY_TIMEOUT_PATH } from "@/lib/daytime-wait-help-proxy-timeout-route";
import { HELP_HUB_CANONICAL_PATH, HELP_TOPIC_BREADCRUMB_HUB_LABEL } from "@/lib/help/help-hub-evidence-copy";
import { KEYBOARD_SHORTCUTS_OPEN_PARAM } from "@/lib/operator/keyboard-shortcuts-dialog-url";
import { KEYBOARD_SHORTCUTS_SECTION_PARAM } from "@/lib/operator/keyboard-shortcuts-section-url";
import { inAppHelpHref } from "@/lib/product-documentation-registry";
import {
  ARCHITECTURE_DESK_PAGE_SHORTCUTS,
} from "@/lib/shortcut-registry";

/** DW-007 — help/diagnostics: edge proxy timeout vs Career Real execute. */
export const DAYTIME_WAIT_HELP_PROXY_TIMEOUT_SLUG = "proxy-timeout-real-execute" as const;

export const DAYTIME_WAIT_HELP_PROXY_TIMEOUT_TITLE = "Proxy timeout vs Real execute" as const;

export const DAYTIME_WAIT_HELP_PROXY_TIMEOUT_TOPIC_LABEL = "Proxy timeout vs Real execute" as const;

export const DAYTIME_WAIT_HELP_PROXY_TIMEOUT_PAGE_SUBTITLE =
  "Edge idle timeout vs async Record execute — poll operations, not fictional run progress." as const;

export const DAYTIME_WAIT_HELP_PROXY_TIMEOUT_CLAIM_DISCIPLINE =
  "A browser or edge timeout is not proof the review failed — check the operations API before retrying execute." as const;

export const DAYTIME_WAIT_HELP_PROXY_TIMEOUT_CLAIM_HEADING_ID =
  "help-proxy-timeout-real-execute-claim-discipline" as const;

export const DAYTIME_WAIT_HELP_PROXY_TIMEOUT_OVERVIEW =
  "Front Door and similar edge proxies may close idle connections around 45–60 seconds. Record Real execute on Working returns 202 Accepted with an operation id — the UI polls GET /v1/operations/{operationId}. A sync timeout is not proof the review failed; check Activity and the shell in-flight strip before retrying." as const;

export const DAYTIME_WAIT_HELP_PROXY_TIMEOUT_APPLICABILITY_WORKING =
  "Working seats treat long Record execute as async operations (ADR 0096). The shell in-flight strip is the resume path — not a stay-on-this-page progress tab." as const;

export const DAYTIME_WAIT_HELP_PROXY_TIMEOUT_APPLICABILITY_GUIDED =
  "Guided, demo, and trial seats may still teach synchronous wait copy that does not match Working async execute." as const;

export const DAYTIME_WAIT_HELP_PROXY_TIMEOUT_APPLICABILITY_SECURENOW =
  "SecureNow (Security) shares the async operations contract for long-running governance mutations — edge timeouts still require operations poll, not immediate retry spam." as const;

export const DAYTIME_WAIT_HELP_PROXY_TIMEOUT_RECORD_PRACTICE_BODY =
  "Record execute on Real host Mode may continue server-side after an edge timeout. Practice runs stay rehearsal-labeled — a timeout on Practice is still not Record proof even when the operation succeeds later." as const;

export const DAYTIME_WAIT_HELP_PROXY_TIMEOUT_ERROR_RECOVERY_HEADING = "When the browser shows a timeout" as const;

export const DAYTIME_WAIT_HELP_PROXY_TIMEOUT_ERROR_RECOVERY = {
  whatFailed: "The browser or edge proxy closed the idle connection before the UI received a final response.",
  whatIsIntact: "The server may have accepted the execute and assigned an operation id — prior review drafts and committed packages are not deleted by the timeout.",
  nextStep: "Open the shell in-flight strip, poll GET /v1/operations/{operationId}, and check Activity on the child review before starting a duplicate execute.",
} as const;

export const DAYTIME_WAIT_HELP_PROXY_TIMEOUT_NO_RETRY_BODY =
  "Do not treat a duplicate execute as recovery when an operation is still Running — visible blocked reasons on the review explain when execute stays disabled." as const;

const inFlightShortcut = ARCHITECTURE_DESK_PAGE_SHORTCUTS.find((entry) => entry.label === "Resume in-flight");

export const DAYTIME_WAIT_HELP_PROXY_TIMEOUT_KEYBOARD_SHORTCUTS_HREF =
  `${DAYTIME_WAIT_HELP_PROXY_TIMEOUT_PATH}?${KEYBOARD_SHORTCUTS_OPEN_PARAM}=1&${KEYBOARD_SHORTCUTS_SECTION_PARAM}=review` as const;

export const DAYTIME_WAIT_HELP_PROXY_TIMEOUT_KEYBOARD_BODY =
  inFlightShortcut === undefined
    ? "Open the keyboard shortcuts dialog (Shift+?) and review the Review section for in-flight resume controls."
    : `Use ${inFlightShortcut.label} (${inFlightShortcut.key}) from the architecture desk to open the shell in-flight strip after an edge timeout.` as const;

export const DAYTIME_WAIT_HELP_PROXY_TIMEOUT_TECHNICAL_BODY =
  `${DAYTIME_WAIT_FORBIDDEN_RUN_PROGRESS_URL_FRAGMENT} does not exist. Progress truth is GET /v1/operations/{operationId} and named lifecycle stages — not ${DAYTIME_WAIT_FORBIDDEN_PERCENT_COMPLETE_PROPERTY}. Technical reference: ${DAYTIME_WAIT_ADR_0096_RELATIVE_PATH}.` as const;

export type DaytimeWaitHelpProxyTimeoutRelatedLink = {
  readonly label: string;
  readonly href: string;
};

export const DAYTIME_WAIT_HELP_PROXY_TIMEOUT_RELATED_TOPICS_HEADING_ID =
  "help-proxy-timeout-real-execute-related-topics" as const;

export const DAYTIME_WAIT_HELP_PROXY_TIMEOUT_RELATED_TOPICS_HEADING = "Related" as const;

export const DAYTIME_WAIT_HELP_PROXY_TIMEOUT_RELATED_LINKS: readonly DaytimeWaitHelpProxyTimeoutRelatedLink[] = [
  { label: "Work continues in the background", href: DAYTIME_WAIT_HELP_BACKGROUND_WAIT_PATH },
  { label: "Record vs Practice on the Working desk", href: inAppHelpHref("career-vs-rehearsal") },
  { label: "Which mode am I in?", href: inAppHelpHref("which-mode-am-i-in") },
  { label: "Engineering troubleshooting", href: inAppHelpHref("engineering-troubleshooting") },
] as const;

export const DAYTIME_WAIT_HELP_PROXY_TIMEOUT_HELP_RETURN = {
  label: HELP_TOPIC_BREADCRUMB_HUB_LABEL,
  href: HELP_HUB_CANONICAL_PATH,
} as const;

export const DAYTIME_WAIT_HELP_PROXY_TIMEOUT_GUIDE_HEADINGS: readonly HelpMarkdownHeading[] = [
  { level: 2, id: DAYTIME_WAIT_HELP_PROXY_TIMEOUT_CLAIM_HEADING_ID, title: "Timeout is not failure proof" },
  { level: 2, id: "help-proxy-timeout-applicability", title: "Scope and seat applicability" },
  { level: 2, id: "help-proxy-timeout-record-practice", title: "Record vs Practice after timeout" },
  { level: 2, id: "help-proxy-timeout-error-recovery", title: DAYTIME_WAIT_HELP_PROXY_TIMEOUT_ERROR_RECOVERY_HEADING },
  { level: 2, id: "help-proxy-timeout-keyboard", title: "Keyboard and in-flight strip" },
  { level: 2, id: "help-proxy-timeout-technical", title: "Technical reference" },
  { level: 2, id: DAYTIME_WAIT_HELP_PROXY_TIMEOUT_RELATED_TOPICS_HEADING_ID, title: DAYTIME_WAIT_HELP_PROXY_TIMEOUT_RELATED_TOPICS_HEADING },
] as const;
