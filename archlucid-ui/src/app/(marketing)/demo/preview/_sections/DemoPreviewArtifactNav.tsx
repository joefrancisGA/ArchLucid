"use client";

import { FileText, GitBranch, History, ShieldCheck, Stamp } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import {
  DEMO_PREVIEW_ARTIFACT_AUDIT_DESC,
  DEMO_PREVIEW_ARTIFACT_AUDIT_TITLE,
  DEMO_PREVIEW_ARTIFACT_EVIDENCE_DESC,
  DEMO_PREVIEW_ARTIFACT_EVIDENCE_TITLE,
  DEMO_PREVIEW_ARTIFACT_SPONSOR_DESC,
  DEMO_PREVIEW_ARTIFACT_SPONSOR_TITLE,
  DEMO_PREVIEW_ARTIFACT_GOVERNANCE_DESC,
  DEMO_PREVIEW_ARTIFACT_GOVERNANCE_TITLE,
  DEMO_PREVIEW_ARTIFACT_SIGNED_DESC,
  DEMO_PREVIEW_ARTIFACT_SIGNED_TITLE,
  DEMO_PREVIEW_ILLUSTRATIVE_DISCLOSURE,
  DEMO_PREVIEW_SUGGESTED_PATH,
} from "@/lib/demo-preview-page-copy";
import { MARKETING_TYPOGRAPHY } from "@/lib/design-tokens";
import { recordShowcaseFunnelEvent } from "@/lib/marketing/showcase-telemetry";
import type { ShowcaseDemoPreviewTelemetry } from "@/lib/marketing/showcase-telemetry";
import { cn } from "@/lib/utils";

const ARTIFACT_ITEMS = [
  {
    id: "artifact-sponsor-report",
    number: "1",
    title: DEMO_PREVIEW_ARTIFACT_SPONSOR_TITLE,
    description: DEMO_PREVIEW_ARTIFACT_SPONSOR_DESC,
    icon: FileText,
  },
  {
    id: "artifact-signed-review-record",
    number: "2",
    title: DEMO_PREVIEW_ARTIFACT_SIGNED_TITLE,
    description: DEMO_PREVIEW_ARTIFACT_SIGNED_DESC,
    icon: Stamp,
  },
  {
    id: "artifact-evidence-graph",
    number: "3",
    title: DEMO_PREVIEW_ARTIFACT_EVIDENCE_TITLE,
    description: DEMO_PREVIEW_ARTIFACT_EVIDENCE_DESC,
    icon: GitBranch,
  },
  {
    id: "artifact-governance-approval",
    number: "4",
    title: DEMO_PREVIEW_ARTIFACT_GOVERNANCE_TITLE,
    description: DEMO_PREVIEW_ARTIFACT_GOVERNANCE_DESC,
    icon: ShieldCheck,
  },
  {
    id: "artifact-audit-trail",
    number: "5",
    title: DEMO_PREVIEW_ARTIFACT_AUDIT_TITLE,
    description: DEMO_PREVIEW_ARTIFACT_AUDIT_DESC,
    icon: History,
  },
] as const;

export function DemoPreviewArtifactNav(props: { readonly showcaseTelemetry?: ShowcaseDemoPreviewTelemetry }) {
  const [activeId, setActiveId] = useState<string>(ARTIFACT_ITEMS[0].id);

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") {
      return;
    }

    const sections = ARTIFACT_ITEMS.map((item) => document.getElementById(item.id)).filter(
      (element): element is HTMLElement => element !== null,
    );

    if (sections.length === 0) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((left, right) => right.intersectionRatio - left.intersectionRatio)[0];

        if (visible?.target.id) {
          setActiveId(visible.target.id);
        }
      },
      { rootMargin: "-20% 0px -55% 0px", threshold: [0.1, 0.35, 0.6] },
    );

    for (const section of sections) {
      observer.observe(section);
    }

    return () => observer.disconnect();
  }, []);

  const scrollToSection = useCallback((sectionId: string) => {
    const target = document.getElementById(sectionId);

    if (target === null) {
      return;
    }

    if (props.showcaseTelemetry && sectionId === "artifact-evidence-graph") {
      recordShowcaseFunnelEvent("evidence_trace_open", props.showcaseTelemetry);
    }

    target.scrollIntoView({ behavior: "smooth", block: "start" });
    setActiveId(sectionId);
  }, [props.showcaseTelemetry]);

  return (
    <section className="space-y-3" data-testid="demo-preview-artifact-nav" aria-label="Guided artifact navigation">
      <p className={cn("m-0 max-w-3xl text-neutral-700 dark:text-neutral-300", MARKETING_TYPOGRAPHY.body)}>
        {DEMO_PREVIEW_SUGGESTED_PATH}
      </p>
      <p className={cn("m-0 text-neutral-600 dark:text-neutral-400", MARKETING_TYPOGRAPHY.meta)}>
        {DEMO_PREVIEW_ILLUSTRATIVE_DISCLOSURE}
      </p>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {ARTIFACT_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeId === item.id;

          return (
            <button
              key={item.id}
              type="button"
              className={cn(
                "flex h-full flex-col gap-2 rounded-lg border bg-white p-4 text-left shadow-sm transition focus-visible:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--al-accent-border-focus)] dark:bg-neutral-950",
                isActive
                  ? "border-teal-600/50 ring-1 ring-teal-600/20 dark:border-teal-400/40"
                  : "border-neutral-200 hover:border-teal-600/30 dark:border-neutral-800 dark:hover:border-teal-400/30",
              )}
              aria-current={isActive ? "true" : undefined}
              data-testid={`demo-preview-artifact-nav-${item.id}`}
              onClick={() => scrollToSection(item.id)}
            >
              <div className="flex items-center gap-2">
                <Icon className="h-4 w-4 shrink-0 text-al-text-secondary dark:text-neutral-300" aria-hidden />
                <span className={cn("font-semibold text-neutral-900 dark:text-neutral-50", MARKETING_TYPOGRAPHY.cardTitle)}>
                  {item.number} · {item.title}
                </span>
              </div>
              <span className={cn("text-neutral-600 dark:text-neutral-400", MARKETING_TYPOGRAPHY.body)}>
                {item.description}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
