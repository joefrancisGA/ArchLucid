import type { ReactNode } from "react";

import { ExecutiveShellFrame } from "@/components/ExecutiveShellFrame";

/** Executive-facing surface: minimal chrome, no operator sidebar. Children load API data via same RSC pattern as operator routes. */
export default function ExecutiveLayout({ children }: { children: ReactNode }) {
  return <ExecutiveShellFrame>{children}</ExecutiveShellFrame>;
}
