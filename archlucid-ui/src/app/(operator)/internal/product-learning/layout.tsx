import type { Metadata } from "next";
import type { ReactNode } from "react";

import { BUYER_TERMINOLOGY } from "@/lib/buyer-surface-vocabulary";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export const metadata: Metadata = {
  title: BUYER_TERMINOLOGY.evaluationFeedback,
  description:
    "Track pilot feedback on review outputs, recurring issues, and improvement opportunities for the current workspace.",
};

export default function ProductLearningLayout({ children }: { children: ReactNode }) {
  return children;
}
