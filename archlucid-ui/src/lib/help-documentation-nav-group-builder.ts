import { BookOpen } from "lucide-react";

import type { NavGroupConfig } from "@/lib/nav-config.types";
import { OPERATOR_NAV_GROUP_LABELS, OPERATOR_NAV_LINK_LABELS } from "@/lib/i18n";

import { NavGroupBuilderBase } from "@/lib/nav-group-builder-base";

/** In-app help center — gives `/help/*` topics a visible shell location. */
export class HelpDocumentationNavGroupBuilder extends NavGroupBuilderBase {
  build(): NavGroupConfig {
    return {
      id: "help-documentation",
      label: OPERATOR_NAV_GROUP_LABELS.help,
      surface: "review-workflow",
      caption: "Guides, troubleshooting, and procurement-ready help topics.",
      links: [
        {
          href: "/help",
          label: OPERATOR_NAV_LINK_LABELS.help,
          title: "Help center — guides, troubleshooting, and security documentation",
          icon: BookOpen,
          tier: "essential",
        },
      ],
    };
  }
}
