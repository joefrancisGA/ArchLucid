export const ARCHITECTURE_SHARING_HELP_PAGE_TITLE = "Architecture sharing inside your tenant" as const;

export const ARCHITECTURE_SHARING_HELP_PAGE_SUBTITLE =
  "Optional restrict-to-shares hides a package from unshared workspace members — still one tenant catalog." as const;

export const ARCHITECTURE_SHARING_HELP_OVERVIEW =
  "By default every architecture in a workspace stays visible to workspace readers. When an owner opts in to restrict-to-shares, only people on the share list can view or decide on that package. Shares are user grants inside the same tenant — not a second tenant and not a chat channel." as const;

export type ArchitectureSharingHelpRoleCard = {
  readonly roleId: "view" | "decide" | "admin";
  readonly title: string;
  readonly body: string;
};

export const ARCHITECTURE_SHARING_HELP_ROLE_CARDS: readonly ArchitectureSharingHelpRoleCard[] = [
  {
    roleId: "view",
    title: "View",
    body: "Read the architecture package, reviews, and evidence — no disposition or share administration.",
  },
  {
    roleId: "decide",
    title: "Decide",
    body: "Working decide actions on shared packages — still subject to career honesty and sealed-record rules.",
  },
  {
    roleId: "admin",
    title: "Admin",
    body: "Manage the share list and restrict-to-shares opt-in for that architecture.",
  },
] as const;

export const ARCHITECTURE_SHARING_HELP_GRANDFATHER_COPY =
  "Existing architectures stay workspace-visible until someone turns on restrict-to-shares. Surprise hiding is treated as a production incident — the default remains open." as const;

export const ARCHITECTURE_SHARING_HELP_NOT_IN_PRODUCT_COPY =
  "ArchLucid does not offer live presence avatars on the review desk, finding-comment chat, or cross-tenant sharing in this wave. Ask your workspace admin for ITSM or chat integrations outside the product boundary." as const;

export const ARCHITECTURE_SHARING_HELP_PRIMARY_CONTENT_ID = "architecture-sharing-help-primary-content" as const;

export const ARCHITECTURE_SHARING_HELP_FIRST_VIEWPORT_TEST_ID = "help-architecture-sharing-first-viewport" as const;
