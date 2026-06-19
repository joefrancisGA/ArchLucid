import type { Metadata } from "next";
import type { ReactNode } from "react";

export {
  dynamic,
  fetchCache,
  revalidate,
} from "@/lib/next/operator-data-route-policy";

export const metadata: Metadata = {
  title: "Planning",
  description:
    "59R improvement themes and prioritized plans: browse evidence-backed planning items (read-only).",
};

export default function PlanningLayout({ children }: { children: ReactNode }) {
  return children;
}
