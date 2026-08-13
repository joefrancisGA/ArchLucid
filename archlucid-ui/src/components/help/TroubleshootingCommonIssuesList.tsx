"use client";

import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { useMemo, useState } from "react";

import { StatusTag } from "@/components/StatusTag";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  TROUBLESHOOTING_COMMON_ISSUES,
  TROUBLESHOOTING_ISSUE_KIND_LABELS,
  type TroubleshootingIssue,
} from "@/lib/troubleshooting-help-guide-content";
import {
  filterTroubleshootingIssues,
  groupTroubleshootingIssuesByKind,
} from "@/lib/troubleshooting-common-issues-triage";
import { resolveTroubleshootingIssueKindStatus } from "@/lib/troubleshooting-issue-kind-status";
import {
  OPERATOR_SHELL_SCROLL_OFFSET_CLASS,
  OPERATOR_TYPOGRAPHY,
} from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

function TroubleshootingIssueCard(props: { readonly issue: TroubleshootingIssue }): React.ReactElement {
  const { issue } = props;
  const kindStatus = resolveTroubleshootingIssueKindStatus(issue.kind);

  return (
    <details
      id={issue.id}
      className={cn(
        "group rounded-lg border border-neutral-200 bg-white px-4 py-3 shadow-sm open:shadow-md dark:border-neutral-800 dark:bg-neutral-950",
        OPERATOR_SHELL_SCROLL_OFFSET_CLASS,
      )}
      data-testid={`troubleshooting-issue-${issue.id}`}
    >
      <summary
        className={cn(
          "flex cursor-pointer list-none flex-wrap items-center gap-2 rounded-md px-1 py-1 marker:content-none hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600/40 dark:hover:bg-neutral-900 [&::-webkit-details-marker]:hidden",
          OPERATOR_TYPOGRAPHY.cardTitle,
        )}
      >
        <ChevronDown
          className="h-4 w-4 shrink-0 text-neutral-500 transition-transform group-open:rotate-180 dark:text-neutral-400"
          aria-hidden
        />
        <span className="font-medium text-al-text-primary">{issue.title}</span>
        <StatusTag kind={kindStatus.kind} label={kindStatus.label} />
      </summary>
      <dl className={cn("m-0 mt-3 space-y-3", OPERATOR_TYPOGRAPHY.body)}>
        <div>
          <dt className="font-medium text-al-text-primary">What you see</dt>
          <dd className="m-0 mt-1 text-al-text-secondary">{issue.whatYouSee}</dd>
        </div>
        <div>
          <dt className="font-medium text-al-text-primary">Likely cause</dt>
          <dd className="m-0 mt-1 text-al-text-secondary">{issue.likelyCause}</dd>
        </div>
        <div>
          <dt className="font-medium text-al-text-primary">Try first</dt>
          <dd className="m-0 mt-1 text-al-text-secondary">{issue.tryFirst}</dd>
        </div>
        <div>
          <dt className="font-medium text-al-text-primary">If still blocked</dt>
          <dd className="m-0 mt-1 text-al-text-secondary">{issue.ifStillBlocked}</dd>
        </div>
      </dl>
      <div className={cn("mt-4 flex flex-wrap gap-2", OPERATOR_TYPOGRAPHY.body)}>
        {issue.nextSteps.map((step) => (
          <Button key={`${issue.id}-${step.href}`} asChild size="sm" variant="outline">
            <Link href={step.href}>{step.label}</Link>
          </Button>
        ))}
      </div>
    </details>
  );
}

/** Filterable, owner-grouped Common issues list for `/help/troubleshooting`. */
export function TroubleshootingCommonIssuesList(): React.ReactElement {
  const [query, setQuery] = useState("");

  const filtered = useMemo(
    () => filterTroubleshootingIssues(TROUBLESHOOTING_COMMON_ISSUES, query),
    [query],
  );
  const groups = useMemo(() => groupTroubleshootingIssuesByKind(filtered), [filtered]);

  return (
    <div className="space-y-3" data-testid="troubleshooting-common-issues-list">
      <div className="space-y-1">
        <label
          htmlFor="troubleshooting-issue-filter"
          className={cn("m-0 font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.helper)}
        >
          Filter symptoms
        </label>
        <Input
          id="troubleshooting-issue-filter"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="e.g. sign in, export, findings"
          data-testid="troubleshooting-issue-filter"
          className="max-w-md"
        />
      </div>

      {groups.length === 0 ? (
        <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)} data-testid="troubleshooting-issues-empty">
          No symptoms match that filter. Clear the filter or try a shorter phrase.
        </p>
      ) : (
        groups.map((group) => (
          <div key={group.kind} className="space-y-2" data-testid={`troubleshooting-issue-group-${group.kind}`}>
            <h3 className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>
              {TROUBLESHOOTING_ISSUE_KIND_LABELS[group.kind]}
            </h3>
            <div className="space-y-3">
              {group.issues.map((issue) => (
                <TroubleshootingIssueCard key={issue.id} issue={issue} />
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
