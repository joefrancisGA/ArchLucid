import { inAppHelpHref } from "@/lib/product-documentation-registry";

export const GLOSSARY_HELP_ACTION_PANEL_TITLE = "Apply these terms";

export const GLOSSARY_HELP_ACTION_PANEL_INTRO =
  "Use the glossary for shared vocabulary — open the product areas below when you need live workflow or assurance trails.";

export const GLOSSARY_HELP_PRIMARY_ACTIONS = {
  openReviews: {
    label: "Open architecture reviews",
    href: "/architecture/reviews",
  },
  openFindingsGuide: {
    label: "Findings guide",
    href: inAppHelpHref("findings"),
  },
  openFirstReviewGuide: {
    label: "Your first architecture review",
    href: inAppHelpHref("first-architecture-review"),
  },
} as const;
