import type { ReactNode } from "react";

import { ExecutiveShellFrame } from "@/components/ExecutiveShellFrame";

/** Same data/auth dependency as operator routes — render on each request, not at build time. */
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

/** Executive-facing surface: minimal chrome, no operator sidebar. Children load API data via same RSC pattern as operator routes. */
export default function ExecutiveLayout({ children }: { children: ReactNode }) {
  return <ExecutiveShellFrame>{children}</ExecutiveShellFrame>;
}
