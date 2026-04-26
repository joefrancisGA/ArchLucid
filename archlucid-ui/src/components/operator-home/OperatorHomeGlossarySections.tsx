"use client";

import Link from "next/link";
import { FileCheck, ListOrdered, Play, Rocket } from "lucide-react";

/**
 * Product-layer cards for operator home — replaces the prior prose-heavy glossary sections.
 * Four action cards for Core Pilot + two summary cards for optional maturity layers.
 */
export function OperatorHomeGlossarySections() {
  return (
    <section className="mt-1 mb-2" aria-labelledby="quick-actions-heading">
      <h3 id="quick-actions-heading" className="sr-only">
        Quick actions
      </h3>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <ActionCard
          icon={Rocket}
          label="Create Run"
          description="Guided wizard — system identity through pipeline"
          href="/runs/new"
          shortcut="Alt+N"
        />
        <ActionCard
          icon={ListOrdered}
          label="View Runs"
          description="List, inspect detail, and track pipeline progress"
          href="/runs?projectId=default"
          shortcut="Alt+R"
          linkAccessibleName="Runs"
        />
        <ActionCard
          icon={Play}
          label="Commit Run"
          description="Produce golden manifest and artifact exports"
          href="/runs?projectId=default"
        />
        <ActionCard
          icon={FileCheck}
          label="Review Artifacts"
          description="Preview, download, and export artifact bundles"
          href="/runs?projectId=default"
        />
      </div>
    </section>
  );
}

type ActionCardProps = {
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  label: string;
  description: string;
  href: string;
  shortcut?: string;
  /** Matches `NAV_GROUPS` shell link name (e.g. Runs) so home quick actions align with sidebar AT. */
  linkAccessibleName?: string;
};

function ActionCard({ icon: Icon, label, description, href, shortcut, linkAccessibleName }: ActionCardProps) {
  return (
    <Link
      href={href}
      aria-label={linkAccessibleName}
      className="group flex flex-col gap-2 rounded-lg border border-neutral-200 bg-white p-4 no-underline shadow-sm transition-shadow hover:shadow-md dark:border-neutral-700 dark:bg-neutral-900"
    >
      <div className="flex items-center gap-2">
        <Icon className="h-5 w-5 shrink-0 text-teal-700 dark:text-teal-400" aria-hidden />
        <span className="text-sm font-semibold text-neutral-900 group-hover:text-teal-800 dark:text-neutral-100 dark:group-hover:text-teal-300">
          {label}
        </span>
        {shortcut ? (
          <kbd className="ml-auto rounded border border-neutral-200 bg-neutral-50 px-1.5 py-0.5 font-mono text-[10px] text-neutral-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-400">
            {shortcut}
          </kbd>
        ) : null}
      </div>
      <span className="text-xs leading-snug text-neutral-600 dark:text-neutral-400">{description}</span>
    </Link>
  );
}
