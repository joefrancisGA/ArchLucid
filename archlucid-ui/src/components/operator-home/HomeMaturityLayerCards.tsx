"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import type { ReactNode } from "react";
import { BarChart3, Search, Shield } from "lucide-react";

import { OPERATOR_HOME_SECTION_HEADING, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { isNextPublicDemoMode } from "@/lib/demo-ui-env";
import { AUDIT_TRAIL_LABEL } from "@/lib/usability/canonical-product-terms";

type LayerCardProps = {
  icon: ReactNode;
  title: string;
  items: string[];
  href: string;
};

function LayerCard({ icon, title, items, href }: LayerCardProps) {
  return (
    <Link
      href={href}
      className="group rounded-lg border border-neutral-200 bg-white p-4 no-underline shadow-sm transition-shadow hover:shadow-md dark:border-neutral-700 dark:bg-neutral-900"
    >
      <div className="mb-2 flex items-center gap-2">
        {icon}
        <h2 className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}>{title}</h2>
      </div>
      <ul className={cn("m-0 list-disc space-y-1 pl-5", OPERATOR_TYPOGRAPHY.body, "text-neutral-600 dark:text-neutral-400")}>
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </Link>
  );
}

/**
 * Home “Explore when ready” cards: trims advanced-only labels outside demo mode so first sessions are not buried in
 * roadmap vocabulary (Planning, Value report, etc.) once a committed manifest exists.
 */
export function HomeMaturityLayerCards() {
  const demoUi = isNextPublicDemoMode();

  const advancedItems = demoUi
    ? (["Compare two reviews", "Replay", "Graph", "Ask", "Advisory scans"] as const)
    : (["Compare two reviews", "Replay", "Graph"] as const);

  const searchItems = demoUi
    ? (["Indexed search", "Planning", "Digests", "Value report"] as const)
    : (["Indexed search"] as const);

  return (
    <section aria-labelledby="maturity-layers-heading">
      <h3
        id="maturity-layers-heading"
        className={cn("mb-3", OPERATOR_HOME_SECTION_HEADING)}
      >
        Explore when ready
      </h3>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <LayerCard
          icon={<BarChart3 className="h-5 w-5 text-sky-600 dark:text-sky-400" aria-hidden />}
          title="Advanced Analysis"
          items={[...advancedItems]}
          href="/insights/compare-two-reviews"
        />
        <LayerCard
          icon={<Shield className="h-5 w-5 text-violet-600 dark:text-violet-400" aria-hidden />}
          title="Enterprise Controls"
          items={["Approval", "Policy packs", AUDIT_TRAIL_LABEL, "Alerts"]}
          href="/governance/findings"
        />
        <LayerCard
          icon={<Search className="h-5 w-5 text-amber-600 dark:text-amber-400" aria-hidden />}
          title="Search & Insights"
          items={[...searchItems]}
          href="/insights/search-review-evidence"
        />
      </div>
    </section>
  );
}
