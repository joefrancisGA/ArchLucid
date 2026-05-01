import { navTitleWithShortcut } from "@/lib/nav-config.shortcuts";
import type { NavGroupConfig } from "@/lib/nav-config.types";

import type { NavGroupBuilder } from "@/lib/nav-group-builder";

/** Shared shortcut-title helper for concrete nav group builders. */
export abstract class NavGroupBuilderBase implements NavGroupBuilder {
  protected shortcutTitle(baseTitle: string, registryCombo: string): string {
    return navTitleWithShortcut(baseTitle, registryCombo);
  }

  abstract build(): NavGroupConfig;
}
