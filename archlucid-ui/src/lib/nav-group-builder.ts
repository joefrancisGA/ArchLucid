import type { NavGroupConfig } from "@/lib/nav-config.types";

/** Builds one **`NavGroupConfig`** for the operator shell (sidebar, palette, drawer). */
export interface NavGroupBuilder {
  build(): NavGroupConfig;
}
