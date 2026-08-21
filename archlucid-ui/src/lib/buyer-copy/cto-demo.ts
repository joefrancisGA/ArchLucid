/**
 * CTO demo tour, presenter controls, and demo-readiness copy.
 *
 * Re-exported by `./index.ts`; import from `@/lib/buyer/buyer-polish-copy` or `@/lib/buyer-copy`.
 */

export const BUYER_HOME_START_CTO_DEMO_HEADING = "Open example review";

export const BUYER_HOME_START_CTO_DEMO_LEAD =
  "Open a completed sample architecture review.";

export const BUYER_HOME_START_CTO_DEMO_CTA = "Open example review";

export const BUYER_HOME_START_CTO_DEMO_ARIA = "Open example review — sample review walkthrough";

export const BUYER_CTO_DEMO_TOUR_HEADING = "CTO demo tour";

export const BUYER_CTO_DEMO_TOUR_ARIA = "CTO demo guided tour";

export const BUYER_CTO_DEMO_TOUR_BACK_CTA = "Back";

export const BUYER_CTO_DEMO_TOUR_NEXT_CTA = "Next";

export const BUYER_CTO_DEMO_TOUR_END_CTA = "End tour";

export const BUYER_CTO_DEMO_TOUR_COLLAPSE_CTA = "Minimize";

export const BUYER_CTO_DEMO_TOUR_EXPAND_CTA = "Expand CTO demo tour";

export const BUYER_CTO_DEMO_READINESS_HEADING = "Demo readiness";

/** Internal admin panel region — must not say "CTO demo" in screenshare or a11y trees (TB-1410). */
export const BUYER_CTO_DEMO_READINESS_ARIA = "Internal demo readiness checks";

export const BUYER_CTO_DEMO_READINESS_READY_LABEL = "Demo ready";

export const BUYER_CTO_DEMO_READINESS_STATIC_LABEL = "Demo ready (static fallback)";

export const BUYER_CTO_DEMO_READINESS_NOT_READY_LABEL = "Demo not ready";

export const BUYER_CTO_DEMO_READINESS_CHECKING_LABEL = "Checking demo readiness…";

export const BUYER_CTO_DEMO_PREPARING_LABEL = "Preparing demo…";

export const BUYER_CTO_DEMO_START_FAILED_MESSAGE = "We could not start the demo right now. Please try again.";

export const BUYER_CTO_DEMO_ENVIRONMENT_UNAVAILABLE_MESSAGE =
  "The demo environment is temporarily unavailable.";

export const BUYER_CTO_DEMO_SAMPLE_MODE_NOTICE =
  "Showing a saved example review for this walkthrough.";

export const BUYER_CTO_DEMO_TRY_AGAIN_CTA = "Try again";

export const BUYER_CTO_DEMO_CONTACT_SUPPORT_CTA = "Contact support";

export const INTERNAL_DEMO_READINESS_PAGE_LEAD =
  "Internal demo diagnostics, showcase controls, and readiness rechecks for ArchLucid operators.";

export const INTERNAL_DEMO_READINESS_DIAGNOSTICS_LINK = "Open diagnostics dashboard";

export const BUYER_CTO_DEMO_READINESS_REFRESH_CTA = "Recheck readiness";

/** Buyer-facing readiness copy — never mention demo seed, static operator mode, or env flags. */
export const BUYER_DEMO_READINESS_SAMPLE_READY_DETAIL = "Sample review is ready.";

export const BUYER_DEMO_READINESS_SAMPLE_UNAVAILABLE_DETAIL = "Sample review is temporarily unavailable.";

export const BUYER_DEMO_READINESS_SAMPLE_PREPARING_DETAIL =
  "Sample review is being prepared. Try again in a moment.";

/** Presenter/operator diagnostics — gated behind internal demo-operator tooling. */
export const BUYER_DEMO_READINESS_OPERATOR_SHOWCASE_API_MISSING =
  "Showcase review not reachable — start the API with demo seed or enable static operator mode.";

export const BUYER_DEMO_READINESS_OPERATOR_SHOWCASE_NOT_FINALIZED =
  "Showcase review exists but is not finalized — run demo seed or finalize the review.";

export const BUYER_DEMO_READINESS_OPERATOR_API_START_REQUIRED =
  "API health check failed — start ArchLucid.Api before the CTO demo.";

export const BUYER_DEMO_READINESS_OPERATOR_AUTH_REQUIRED =
  "Sign in or enable demo/static operator flags before presenting live API data.";

export const BUYER_DEMO_READINESS_BUYER_API_UNAVAILABLE = "Service is temporarily unavailable.";

export const BUYER_DEMO_READINESS_BUYER_AUTH_REQUIRED = "Sign in to continue.";

export const BUYER_CTO_DEMO_RESET_CTA = "Reset demo";

export const BUYER_CTO_DEMO_RESET_BUSY_CTA = "Resetting demo…";

export const BUYER_CTO_DEMO_RESET_SUCCESS = "Demo reset — restarting the five-step tour.";

export const BUYER_CTO_DEMO_TOUR_NOTES_HIDE_CTA = "Hide presenter notes";

export const BUYER_CTO_DEMO_TOUR_NOTES_SHOW_CTA = "Show presenter notes";

export const BUYER_CTO_DEMO_TOUR_NOTES_FULL_CTA = "Full script";

export const BUYER_CTO_DEMO_TOUR_NOTES_SUMMARY_CTA = "Summary";

export const BUYER_CTO_DEMO_QUESTIONS_SHOW_CTA = "CTO questions";

export const BUYER_CTO_DEMO_QUESTIONS_HIDE_CTA = "Hide CTO questions";

export const BUYER_CTO_DEMO_RECAP_HEADING = "Sponsor recap for follow-up";

export const BUYER_CTO_DEMO_RECAP_COPY_CTA = "Copy recap";

export const BUYER_CTO_DEMO_RECAP_DOWNLOAD_CTA = "Download recap (.md)";

export const BUYER_CTO_DEMO_RECAP_BOARD_PACKET_CTA = "Download board packet";

export const BUYER_CTO_DEMO_RECAP_BOARD_PACKET_BUSY_CTA = "Board packet…";

export const BUYER_CTO_DEMO_COMPARE_DRIFT_LABEL = "Optional 3b — Show drift";

export const BUYER_CTO_DEMO_COMPARE_DRIFT_CTA = "See what changed →";

export const BUYER_CTO_DEMO_PANIC_SCRIPT_HEADING = "Offline fallback";

export const BUYER_CTO_DEMO_PANIC_SCRIPT_BODY =
  "If the API goes down: say \"Let me switch to our pre-loaded version — same data, same output.\" Then click Enable offline fallback below. Navigate to Step 1 using keyboard shortcut 1. Continue the walkthrough — all five steps work offline.";

export const BUYER_CTO_DEMO_PANIC_ENABLE_CTA = "Enable offline fallback";

export const BUYER_CTO_DEMO_PANIC_ENABLED_LABEL = "Offline fallback active";

export const BUYER_SIMULATOR_TRUST_BADGE_LABEL =
  "Rule-based analysis — findings match live-mode structure; cost estimates are illustrative.";

export const BUYER_SIMULATOR_TRUST_BADGE_TOOLTIP =
  "Simulator mode runs the full four-agent pipeline using rule-based inference. Findings have the same structure as live mode; cost estimates are illustrative.";

export const BUYER_CTO_DEMO_AUDIT_EXPORT_CTA = "Export audit trail (CSV)";

export const BUYER_CTO_DEMO_AUDIT_EXPORT_BUSY = "Exporting…";

export const BUYER_CTO_DEMO_AUDIT_EXPORT_SUCCESS =
  "Audit trail exported — attach to your GRC record.";

export const BUYER_CTO_DEMO_DATA_SOURCE_LIVE_LABEL = "Live data";

export const BUYER_CTO_DEMO_DATA_SOURCE_SAMPLE_LABEL = "Sample data — Claims Intake showcase";

export const COMMAND_PALETTE_START_CTO_DEMO_LABEL = "Start CTO demo tour";

export const COMMAND_PALETTE_RESET_DEMO_LABEL = "Reset demo";

export const BUYER_CTO_DEMO_TOUR_KEYBOARD_HINT =
  "Press 1–5 to jump steps · E — explore · P — presenter notes · S — spotlight · 0 — offline · Shift+R — hard reset";

export const BUYER_CTO_DEMO_TOUR_AUTOPLAY_ON_CTA = "Auto-play";

export const BUYER_CTO_DEMO_TOUR_AUTOPLAY_OFF_CTA = "Stop auto";

export const BUYER_CTO_DEMO_TOUR_AUTOPLAY_BADGE = "Auto";

export const BUYER_CTO_DEMO_SMOKE_CHECK_CTA = "Pre-call check";

export const BUYER_CTO_DEMO_SMOKE_CHECK_RECHECK_CTA = "Re-check";

export const BUYER_CTO_DEMO_SOFT_RESTART_CTA = "Back to step 1";

export const BUYER_CTO_DEMO_RECAP_SNAPSHOT_COPY_CTA = "Copy snapshot link";

export const BUYER_CTO_DEMO_PANIC_BANNER =
  "Offline mode active — cached showcase data in use";

export const BUYER_CTO_DEMO_PANIC_DISABLE_CTA = "Disable";

export const BUYER_CTO_DEMO_READ_ONLY_SNAPSHOT_BANNER =
  "Shared read-only view — this link is safe to forward after the live demo.";

export function buyerCtoDemoRemainingMinutesLabel(minutes: number): string {
  return `~${minutes} min remaining`;
}

export const BUYER_CTO_DEMO_RUN_OF_SHOW_DOWNLOAD_CTA = "Download run-of-show";

export const BUYER_CTO_DEMO_SEGREGATION_CALLOUT_HEADING = "Segregation of duties";

export const BUYER_CTO_DEMO_SEGREGATION_CALLOUT_BODY =
  "The review requester and approver are different principals — neither can unilaterally finalize the review.";

export const BUYER_CTO_DEMO_AUDIT_DEMO_FILTER_BANNER =
  "Showing demo-relevant events only — create, execute, commit, and export milestones.";

export const BUYER_CTO_DEMO_AUDIT_SHOW_ALL_EVENTS_CTA = "Show all events";

export const BUYER_CTO_DEMO_SPONSOR_PRINT_CTA = "Print sponsor report";

export const BUYER_CTO_DEMO_STATIC_PRESENTER_BANNER =
  "Presenter: all five demo steps are running on cached showcase data — live API is unavailable or static fallback is enabled.";

export const BUYER_CTO_DEMO_LATENCY_OK = "Within demo latency budget";

export const BUYER_CTO_DEMO_LATENCY_EXCEEDED = "Taking longer than expected — switch to example review.";

export const BUYER_CTO_DEMO_AUDIT_CLOSING_HEADING = "Your diligence bundle is ready.";

export const BUYER_CTO_DEMO_AUDIT_CLOSING_SUBTEXT =
  "Download the board packet — a PDF summary of findings, decisions, and the governance record — to share with your sponsor or procurement team.";

export const BUYER_CTO_DEMO_NEXT_STEPS_HEADING = "Next steps";

export const BUYER_CTO_DEMO_NEXT_STEPS_SUBTEXT =
  "Continue diligence with your team — start a pilot, book a security review, or download the trust pack for procurement.";

export const BUYER_CTO_DEMO_NEXT_STEPS_PILOT_CTA = "Start a pilot";

export const BUYER_CTO_DEMO_NEXT_STEPS_SECURITY_REVIEW_CTA = "Book a security review";

export const BUYER_CTO_DEMO_NEXT_STEPS_TRUST_PACK_CTA = "Get the trust pack";

export const BUYER_CTO_DEMO_STORY_GATED_NOTE =
  "Healthcare data shown in this demo — other verticals are talk-track only until a pilot is provisioned.";

export const BUYER_CTO_DEMO_PREFLIGHT_HEADING = "Before you begin";

export const BUYER_CTO_DEMO_PREFLIGHT_BEGIN_CTA = "Begin demo";

export const BUYER_CTO_DEMO_AGENDA_HEADING = "Your 30-minute review journey";

export const BUYER_CTO_DEMO_AGENDA_SUBTEXT =
  "Five stops from sponsor outcomes through finalized review record, evidence, resolve outcomes, and audit trail.";

export const BUYER_CTO_DEMO_AUDIT_VERIFY_CTA = "Verify integrity";

export const BUYER_CTO_DEMO_AUDIT_VERIFY_BUSY = "Verifying…";

export const BUYER_CTO_DEMO_AUDIT_VERIFY_SUCCESS = "Chain intact";

export const BUYER_CTO_DEMO_AUDIT_VERIFY_FAIL = "Chain broken";

export const BUYER_CTO_DEMO_ISOLATION_PROOF_HEADING = "Tenant isolation evidence";

export const BUYER_CTO_DEMO_ISOLATION_PROOF_BODY =
  "Each customer receives a dedicated database catalog. The showcase below is isolated from all other tenants.";

export const BUYER_CTO_DEMO_GOVERNANCE_PREVIEW_BADGE = "Demo preview — read-only view";

export const BUYER_CTO_DEMO_GOVERNANCE_PREVIEW_NOTE =
  "In production, an architect with Execute authority approves here. This view shows the post-approval state from the example review.";

export const BUYER_CTO_DEMO_VALUE_STRIP_LABELS: readonly string[] = [
  "This sponsor report gives your sponsor a one-page risk and outcome verdict — no engineering context required.",
  "This sealed review record is the verifiable record of every decision made in this review — your auditors' starting point.",
  "Every finding traces back to the exact evidence that produced it — no black-box AI.",
  "This approval gate enforces separation-of-duties before any architecture change is promoted to production.",
  "Every event in this timeline is immutable and exportable — the compliance trail your auditors need on day one.",
] as const;
