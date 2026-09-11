/** LW-094 — in-app help: work lease + CAS when two architects edit one draft (ADR 0090). */
import type { HelpMarkdownHeading } from "@/lib/help/help-markdown-headings";
import { ARCHITECTURE_DRAFT_EDITING_HELP_PATH } from "@/lib/architecture/architecture-draft-editing-help-route";
import { inAppHelpHref } from "@/lib/product-documentation-registry";

export const ARCHITECTURE_DRAFT_EDITING_HELP_PAGE_TITLE = "Two people on one draft";

export const ARCHITECTURE_DRAFT_EDITING_HELP_PAGE_SUBTITLE =
  "Soft edit lease, compare-and-swap saves, and offline reconnect — not a shared collab editor.";

export const ARCHITECTURE_DRAFT_EDITING_HELP_OVERVIEW =
  "Two architects can open the same architecture draft. ArchLucid uses a soft work lease and version checks on save so you do not silently overwrite each other. This is not Google Docs-style co-editing, live cursors, or chat on the draft desk.";

export const ARCHITECTURE_DRAFT_EDITING_HELP_LEASE_TITLE = "Edit lease banner";

export const ARCHITECTURE_DRAFT_EDITING_HELP_LEASE_COPY =
  "When you open a drafting desk, ArchLucid tries to acquire a short-lived edit lease. If someone else already holds an unexpired lease, you see a banner naming the holder and when the lease expires. That banner is not live presence — it only reflects the last lease the server recorded.";

export const ARCHITECTURE_DRAFT_EDITING_HELP_STEAL_TITLE = "Take over the lease";

export const ARCHITECTURE_DRAFT_EDITING_HELP_STEAL_COPY =
  "You can take over the lease after an explicit confirm. Their unsaved server changes do not merge into your tab. If they save after you take over, you can still get a conflict and must choose Keep mine or load the server copy. Takeover is audited.";

export const ARCHITECTURE_DRAFT_EDITING_HELP_CONFLICT_TITLE = "409 conflict and Keep mine";

export const ARCHITECTURE_DRAFT_EDITING_HELP_CONFLICT_COPY =
  "Each save sends the draft version the tab last accepted. If the server moved ahead — another session saved, offline replay landed, or you lost the lease — save returns a conflict. Your on-screen edits stay intact. Choose Keep mine to retry with a force overwrite when you intend to replace the server copy, or reload to load the latest server draft.";

export const ARCHITECTURE_DRAFT_EDITING_HELP_OFFLINE_TITLE = "Offline and reconnect";

export const ARCHITECTURE_DRAFT_EDITING_HELP_OFFLINE_COPY =
  "If you go offline, autosave queues locally and replays when connectivity returns. Replay uses the same version checks. Expect a conflict banner if someone else saved while you were away. Refresh or resolve the conflict before assuming the server matches your tab.";

export const ARCHITECTURE_DRAFT_EDITING_HELP_BOUNDARY_TITLE = "Not a collab editor";

export const ARCHITECTURE_DRAFT_EDITING_HELP_BOUNDARY_COPY =
  "ArchLucid does not ship simultaneous multi-cursor editing, occupancy avatars, or draft-thread chat. For discussion on findings, use exports or your ITSM integration. For access control on who may edit, see architecture sharing when restrict-to-shares is enabled.";

export const ARCHITECTURE_DRAFT_EDITING_HELP_PRIMARY_ACTION = {
  label: "Architecture drafts",
  href: inAppHelpHref("architecture-drafts"),
} as const;

export const ARCHITECTURE_DRAFT_EDITING_HELP_RELATED = {
  label: "Architecture sharing",
  href: inAppHelpHref("architecture-sharing"),
} as const;

export const ARCHITECTURE_DRAFT_EDITING_HELP_FIRST_VIEWPORT_TEST_ID =
  "help-architecture-draft-editing-first-viewport" as const;

export const ARCHITECTURE_DRAFT_EDITING_HELP_PRIMARY_CONTENT_ID =
  "architecture-draft-editing-help-primary-content" as const;

export const ARCHITECTURE_DRAFT_EDITING_HELP_GUIDE_TEST_ID =
  "help-architecture-draft-editing-guide" as const;

export const ARCHITECTURE_DRAFT_EDITING_HELP_GUIDE_HEADINGS: readonly HelpMarkdownHeading[] = [
  { level: 2, id: "edit-lease", title: ARCHITECTURE_DRAFT_EDITING_HELP_LEASE_TITLE },
  { level: 2, id: "take-over-lease", title: ARCHITECTURE_DRAFT_EDITING_HELP_STEAL_TITLE },
  { level: 2, id: "conflict-keep-mine", title: ARCHITECTURE_DRAFT_EDITING_HELP_CONFLICT_TITLE },
  { level: 2, id: "offline-reconnect", title: ARCHITECTURE_DRAFT_EDITING_HELP_OFFLINE_TITLE },
  { level: 2, id: "not-collab", title: ARCHITECTURE_DRAFT_EDITING_HELP_BOUNDARY_TITLE },
  { level: 2, id: "where-to-go-next", title: "Where to go next" },
];

/** Drift guard — in-app help must not deep-link GitHub blob URLs. */
export const ARCHITECTURE_DRAFT_EDITING_HELP_FORBIDDEN_LINK_MARKERS = [
  "github.com",
  "/blob/",
] as const;

export const ARCHITECTURE_DRAFT_EDITING_HELP_CANONICAL_HANDOFF_MARKERS = [
  ARCHITECTURE_DRAFT_EDITING_HELP_PATH,
  "architecture-draft-editing",
  "ARCHITECTURE_DRAFT_EDITING_HELP_PATH",
] as const;
