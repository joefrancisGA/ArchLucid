import type { Metadata } from "next";

import { BUYER_TERMINOLOGY } from "@/lib/buyer-surface-vocabulary";
import { OperatorClientDrivenRouteLayout } from "@/lib/next/operator-client-driven-route-layout";

export const metadata: Metadata = {
  title: BUYER_TERMINOLOGY.evaluationFeedback,
  description:
    "Track pilot feedback on review outputs, recurring issues, and improvement opportunities for the current workspace.",
};

export default OperatorClientDrivenRouteLayout;
