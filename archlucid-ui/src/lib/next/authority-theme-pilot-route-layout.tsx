import type { ReactNode } from "react";

import { AuthorityThemePilotScope } from "@/components/AuthorityThemePilotScope";

export default function AuthorityThemePilotRouteLayout({ children }: { children: ReactNode }) {
  return <AuthorityThemePilotScope>{children}</AuthorityThemePilotScope>;
}
