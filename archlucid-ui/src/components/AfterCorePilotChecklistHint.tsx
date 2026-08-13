"use client";
import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import { ChevronDown } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { InlineGuidanceLabel } from "@/components/InlineGuidanceLabel";
import { DismissControl } from "@/components/usability/DismissControl";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  AFTER_CORE_PILOT_WHATS_NEXT_DISMISSED_KEY,
  CORE_PILOT_CHECKLIST_CHANGED_EVENT,
  readAfterCorePilotWhatsNextDismissed,
} from "@/lib/core-pilot-checklist-storage";
import { GOVERNANCE_POLICY_PACKS_PATH } from "@/lib/governance/governance-route-paths";
import { useCorePilotDerivedStepStatus } from "@/lib/use-core-pilot-derived-step-status";
import { SHOW_ALL_DESTINATIONS } from "@/lib/nav-disclosure-copy";

type Suggestion = {
  title: string;
  href: string;
  description: string;
  sidebarNote: string;
};

const suggestions: Suggestion[] = [
  {
    title: "Compare two reviews",
    href: "/insights/compare-two-reviews",
    description: "Structured architecture snapshot diff between a baseline review and a target review when you need to know what changed.",
    sidebarNote: `Use “${SHOW_ALL_DESTINATIONS.show}” in the sidebar if a group is collapsed.`,
  },
  {
    title: "Explore the architecture graph",
    href: "/insights/evidence-graph",
    description: "Provenance or architecture graph for a review ID when a list view is not enough.",
    sidebarNote: `Use “${SHOW_ALL_DESTINATIONS.show}” in the sidebar if Insights is collapsed.`,
  },
  {
    title: "Set up governance alerts",
    href: "/governance/alert-rules",
    description: "Inbox, routing, and rules on one hub—tune when architecture-risk signals need action.",
    sidebarNote:
      "Alerts is under Governance (sidebar). Open Alerts, then use the Rules tab for configuration.",
  },
  {
    title: "Review policy packs",
    href: GOVERNANCE_POLICY_PACKS_PATH,
    description: "Versions, effective content, and how governance rules attach to your scope.",
    sidebarNote: `Expand Governance in the sidebar, or use “${SHOW_ALL_DESTINATIONS.show}” if groups are hidden.`,
  },
];

/**
 * After the Core Pilot checklist is complete, optional “what’s next” suggestions (not a second checklist)
 * with dismissal persisted in localStorage. Does not change sidebar toggles—only explains them.
 */
export function AfterCorePilotChecklistHint() {
  const { progress } = useCorePilotDerivedStepStatus();
  const [dismissed, setDismissed] = useState(false);

  const refreshDismissed = useCallback(() => {
    setDismissed(readAfterCorePilotWhatsNextDismissed());
  }, []);

  useEffect(() => {
    refreshDismissed();

    function onChanged() {
      refreshDismissed();
    }

    window.addEventListener(CORE_PILOT_CHECKLIST_CHANGED_EVENT, onChanged);

    return () => {
      window.removeEventListener(CORE_PILOT_CHECKLIST_CHANGED_EVENT, onChanged);
    };
  }, [refreshDismissed]);

  const onDismiss = useCallback(() => {
    try {
      window.localStorage.setItem(AFTER_CORE_PILOT_WHATS_NEXT_DISMISSED_KEY, "1");
    } catch {
      /* private mode */
    }
    setDismissed(true);
  }, []);

  if (!progress.allDone || dismissed) {
    return null;
  }

  return (
    <section
      className="mb-5 max-w-3xl"
      aria-labelledby="after-core-pilot-card-title"
      data-testid="after-core-pilot-whats-next"
    >
      <Card className="border border-neutral-200 bg-al-surface-raised dark:border-neutral-800">
        <CardHeader className="space-y-1 sm:flex sm:flex-row sm:items-start sm:justify-between sm:space-y-0">
          <div>
            <h3 id="after-core-pilot-card-title" className={cn("m-0 font-semibold text-al-text-primary tracking-tight text-teal-950 dark:text-teal-100", OPERATOR_TYPOGRAPHY.cardTitle)}>
              Ready for more?
            </h3>
            <p className={cn("m-0 mt-0.5 text-teal-800/90 dark:text-teal-200/90", OPERATOR_TYPOGRAPHY.helper)}>Expand your pilot — optional next steps</p>
          </div>
          <DismissControl
            data-testid="after-core-pilot-whats-next-dismiss"
            onDismiss={onDismiss}
          />
        </CardHeader>
        <CardContent className="space-y-4">
          <p className={cn("m-0 text-neutral-800 dark:text-neutral-200", OPERATOR_TYPOGRAPHY.body)} data-testid="after-core-pilot-intro">
            When you have a real question that review detail cannot answer—<strong>what changed between two reviews</strong>,{" "}
            <strong>whether the provenance chain still validates</strong>, or a <strong>visual graph</strong>—the links
            below point to deeper analysis. <strong>Enterprise Controls</strong> (governance, audit, alerts) stay in
            the sidebar until sponsors or policy need them—not part of first-pilot success criteria.
          </p>

          <Collapsible defaultOpen className="rounded-md border border-teal-200/80 bg-white/70 dark:border-teal-900/60 dark:bg-teal-950/30">
            <CollapsibleTrigger
              className={cn("auth-panel-focus flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left font-semibold text-teal-950 dark:text-teal-100 [&[data-state=open]_svg]:rotate-180", OPERATOR_TYPOGRAPHY.cardTitle)}
              data-testid="after-core-pilot-whats-next-collapsible-trigger"
            >
              Suggested next steps
              <ChevronDown className="size-4 shrink-0 transition-transform" aria-hidden />
            </CollapsibleTrigger>
            <CollapsibleContent>
              <ul className="m-0 list-none space-y-3 border-t border-teal-200/60 px-3 py-3 dark:border-teal-800/50">
                {suggestions.map((s, index) => {
                  return (
                    <li key={s.href} className={cn("text-neutral-800 dark:text-neutral-200", OPERATOR_TYPOGRAPHY.body)}>
                      <div className="font-medium text-teal-900 dark:text-teal-200">
                        <Link href={s.href} className="underline decoration-teal-600/50 underline-offset-2 hover:decoration-teal-800 dark:decoration-teal-500/50 dark:hover:text-teal-100">
                          {s.title}
                        </Link>
                      </div>
                      <p className="m-0 mt-0.5 text-neutral-700 dark:text-neutral-300">{s.description}</p>
                      <p
                        className={cn("m-0 mt-1.5 text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}
                        data-testid={`after-core-pilot-sidebar-note-${index}`}
                      >
                        <InlineGuidanceLabel label="Sidebar:" className="font-medium text-neutral-600 dark:text-neutral-500" />{" "}
                        {s.sidebarNote}
                      </p>
                    </li>
                  );
                })}
              </ul>
            </CollapsibleContent>
          </Collapsible>
        </CardContent>
      </Card>
    </section>
  );
}
