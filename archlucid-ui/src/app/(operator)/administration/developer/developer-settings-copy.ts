/** Shipped widgets on `/administration/developer` — keep catalog and page copy aligned (TB-1897). */
export const INTERNAL_DEVELOPER_TOOLS_SHIPPED_INVENTORY = [
  "Branded theme evaluation",
  "Local CLI demo",
] as const;

export const INTERNAL_DEVELOPER_TOOLS_PAGE_TITLE = "Internal developer tools" as const;

export const INTERNAL_DEVELOPER_TOOLS_INTERNAL_ONLY_TAG = "Internal only" as const;

export const INTERNAL_DEVELOPER_TOOLS_INTRO =
  "Branded theme evaluation and an optional local CLI demo for internal support workflows.";

export const INTERNAL_DEVELOPER_TOOLS_CATALOG_DESCRIPTION = INTERNAL_DEVELOPER_TOOLS_INTRO;

/** Catalog + page honesty for ReadAuthority gate and internal-shell discovery (TB-1899). */
export const INTERNAL_DEVELOPER_TOOLS_ACCESS_NOTE =
  "ReadAuthority workspace readers can open this page. The Administration hub lists it only when the internal shell is enabled; customer shells redirect to Preferences." as const;

export const INTERNAL_DEVELOPER_TOOLS_CATALOG_GATE_NOTE =
  "Internal shell only — ReadAuthority; not linked from customer settings navigation." as const;
