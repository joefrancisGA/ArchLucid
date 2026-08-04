import type { Metadata } from "next";
import type { ReactNode } from "react";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export const metadata: Metadata = {
  title: "Planning",
  description:
    "Improvement themes and prioritized plans: browse evidence-backed planning items (read-only).",
};

export default function PlanningLayout({ children }: { children: ReactNode }) {
  return children;
}
