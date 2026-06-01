"use client";

import Link from "next/link";

import { FirstPilotTechnicalCommandDisclosure } from "@/components/FirstPilotTechnicalCommandDisclosure";
import { OperatorHomeDisclosureSection } from "@/components/operator-home/OperatorHomeDisclosureSection";
import { OperatorHomeGuidanceLink } from "@/components/operator-home/OperatorHomeGuidanceLink";
import { OperatorHomeGuidanceLinks } from "@/components/operator-home/OperatorHomeGuidanceLinks";
import { OPERATOR_HOME_DISCLOSURE_STORAGE_KEYS } from "@/lib/operator-home-disclosure-storage";

const STEPS = [
  { label: "Platform ready", href: "/health", testId: "pilot-start-platform" },
  { label: "Evidence (extractor or demo)", href: "/help", testId: "pilot-start-evidence" },
  { label: "Create & execute review", href: "/reviews/new", testId: "pilot-start-run" },
  { label: "Commit & finalize review package", href: "/help", testId: "pilot-start-proof" },
] as const;

const FAST_PATH_CLI_COMMANDS = [
  "archlucid pilot proof-packet <runId>",
  "collect-first-pilot-proof.ps1 -RunId …",
] as const;

/** Fast-path four-step strip on operator home (assessment #4). */
export function PilotStartHereStrip(): React.JSX.Element {
  return (
    <OperatorHomeDisclosureSection
      title="Fast path to first review package"
      titleId="pilot-start-here-heading"
      sectionTestId="pilot-start-here-strip"
      storageKey={OPERATOR_HOME_DISCLOSURE_STORAGE_KEYS.pilotStartHere}
      defaultExpanded={false}
      collapsedSummary="Four-step sequence from platform readiness to a finalized review package."
      sectionClassName="border-neutral-200 bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900/50"
    >
      <OperatorHomeGuidanceLinks className="mb-3">
        <OperatorHomeGuidanceLink helpSlug="first-pilot-path" label="Open the canonical operator checklist" />
        <OperatorHomeGuidanceLink helpSlug="first-value-20-minutes" label="Open the 20-minute time-boxed runbook" />
      </OperatorHomeGuidanceLinks>

      <ol className="m-0 flex list-none flex-wrap gap-3 p-0">
        {STEPS.map((step, index) => (
          <li key={step.testId} className="flex items-center gap-2 text-sm">
            <span
              className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-neutral-900 text-xs font-semibold text-white dark:bg-neutral-100 dark:text-neutral-900"
              aria-hidden
            >
              {index + 1}
            </span>
            <Link
              href={step.href}
              className="font-medium text-neutral-900 underline-offset-2 hover:underline dark:text-neutral-100"
              data-testid={step.testId}
            >
              {step.label}
            </Link>
          </li>
        ))}
      </ol>
      <p className="mt-3 mb-0 text-xs text-neutral-600 dark:text-neutral-400">
        Primary sequence: platform ready → evidence → create/execute/commit → finalize review package → commercial
        next step. Operate, V1.1 connectors, and MCP stay optional after first commit.
      </p>
      <FirstPilotTechnicalCommandDisclosure commands={FAST_PATH_CLI_COMMANDS} />
    </OperatorHomeDisclosureSection>
  );
}
