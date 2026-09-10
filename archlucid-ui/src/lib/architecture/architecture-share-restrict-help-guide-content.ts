/** AS-098 — in-app help topic: architecture shares are not a second tenant and not chat. */
import type { HelpMarkdownHeading } from "@/lib/help/help-markdown-headings";
import { ARCHITECTURE_SHARE_ROLES } from "@/lib/architecture/architecture-share-validation";
import { ARCHITECTURE_SHARE_RESTRICT_HELP_PATH } from "@/lib/architecture/architecture-share-restrict-help-route";
import { inAppHelpHref } from "@/lib/product-documentation-registry";

export const ARCHITECTURE_SHARE_RESTRICT_HELP_PAGE_TITLE = "Architecture sharing";

export const ARCHITECTURE_SHARE_RESTRICT_HELP_PAGE_SUBTITLE =
  "Optional restrict-to-shares inside your workspace — named people, share roles, and one tenant boundary.";

export const ARCHITECTURE_SHARE_RESTRICT_HELP_OVERVIEW =
  "Architecture shares let you limit who can see a specific architecture without creating a second tenant. By default every architecture stays workspace-visible until you opt in to restrict-to-shares on the Identity desk.";

export type ArchitectureShareRestrictHelpRoleTile = {
  readonly id: (typeof ARCHITECTURE_SHARE_ROLES)[number];
  readonly label: string;
  readonly detail: string;
};

export const ARCHITECTURE_SHARE_RESTRICT_HELP_ROLE_TILES: readonly ArchitectureShareRestrictHelpRoleTile[] = [
  {
    id: "View",
    label: "View",
    detail: "Read the architecture desk, sealed history, and exports already allowed by workspace read authority.",
  },
  {
    id: "Decide",
    label: "Decide",
    detail:
      "View plus Working decide actions — dispositions, inventory bind/unbind, and finalize — only when the person also holds workspace execute authority.",
  },
  {
    id: "Admin",
    label: "Admin",
    detail: "Decide plus manage the share list and the restrict-to-shares setting for this architecture.",
  },
] as const;

export const ARCHITECTURE_SHARE_RESTRICT_HELP_GRANDFATHER_TITLE = "Grandfather default stays open";

export const ARCHITECTURE_SHARE_RESTRICT_HELP_GRANDFATHER_COPY =
  "Restrict-to-shares is opt-in. Until you turn it on, everyone with workspace read access can see the architecture — the same behavior as before architecture shares shipped. Turning restrict on requires confirmation; you are added as Admin so you do not lock yourself out.";

export const ARCHITECTURE_SHARE_RESTRICT_HELP_ONE_TENANT_TITLE = "Still one workspace tenant";

export const ARCHITECTURE_SHARE_RESTRICT_HELP_ONE_TENANT_COPY =
  "Shares scope visibility and decide actions inside your existing workspace tenant. They do not create a second tenant, a guest org, or SQL row-level security. Catalog isolation and workspace roles from users and roles still apply — share gates add checks on restricted architectures; they do not replace workspace authority.";

export const ARCHITECTURE_SHARE_RESTRICT_HELP_BOUNDARY_TITLE = "Not chat or live presence";

export const ARCHITECTURE_SHARE_RESTRICT_HELP_BOUNDARY_COPY =
  "Architecture shares are access control — not Slack-style finding comments, @mentions, or live presence avatars on the review desk. If you need threaded discussion on a finding, export or use your ITSM integration; ArchLucid does not ship in-finding chat in this release.";

export const ARCHITECTURE_SHARE_RESTRICT_HELP_PRIMARY_ACTION = {
  label: "Users and roles",
  href: inAppHelpHref("users-and-roles"),
} as const;

export const ARCHITECTURE_SHARE_RESTRICT_HELP_RELATED = {
  label: "Data handling and tenant isolation",
  href: inAppHelpHref("data-handling"),
} as const;

export const ARCHITECTURE_SHARE_RESTRICT_HELP_GUIDE_HEADINGS: readonly HelpMarkdownHeading[] = [
  { level: 2, id: "restrict-and-roles", title: "Restrict-to-shares and share roles" },
  { level: 2, id: "grandfather-default", title: ARCHITECTURE_SHARE_RESTRICT_HELP_GRANDFATHER_TITLE },
  { level: 2, id: "one-tenant", title: ARCHITECTURE_SHARE_RESTRICT_HELP_ONE_TENANT_TITLE },
  { level: 2, id: "product-boundary", title: ARCHITECTURE_SHARE_RESTRICT_HELP_BOUNDARY_TITLE },
  { level: 2, id: "where-to-go-next", title: "Where to go next" },
];

/** Drift guard — in-app help must not deep-link GitHub blob URLs. */
export const ARCHITECTURE_SHARE_RESTRICT_HELP_FORBIDDEN_LINK_MARKERS = [
  "github.com",
  "/blob/",
] as const;

export const ARCHITECTURE_SHARE_RESTRICT_HELP_CANONICAL_HANDOFF_MARKERS = [
  ARCHITECTURE_SHARE_RESTRICT_HELP_PATH,
  "architecture-sharing",
  "ARCHITECTURE_SHARE_RESTRICT_HELP_PATH",
] as const;
