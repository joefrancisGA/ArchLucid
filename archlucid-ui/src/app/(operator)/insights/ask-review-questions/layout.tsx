import type { ReactNode } from "react";

/**
 * Ask is client-driven (streaming, thread history). Avoid force-dynamic so the shell can reuse
 * cached layout segments; live data still flows through client fetches and React Query.
 */
export default function AskLayout({ children }: { children: ReactNode }) {
  return children;
}
