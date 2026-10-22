import type { ReactNode } from "react";

import { OperatorLayoutClient } from "./OperatorLayoutClient";

/** Shell is client-driven; child routes opt into request-time rendering only when needed. */
export default function OperatorLayout({ children }: { children: ReactNode }) {
  return <OperatorLayoutClient>{children}</OperatorLayoutClient>;
}
