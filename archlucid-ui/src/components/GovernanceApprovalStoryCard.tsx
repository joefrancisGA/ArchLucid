import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import type { GovernanceApprovalRequest } from "@/types/governance-workflow";
import { cn } from "@/lib/utils";

/**
 * Buyer-walkthrough summary: one card that narrates submit → review → approve → governed package readiness
 * without surfacing internal approval IDs or environment-promotion framing.
 */
export function GovernanceApprovalStoryCard(props: {
  readonly row: GovernanceApprovalRequest;
  /** Buyer shell: sealed primary next step beneath the milestone narrative */
  readonly auditTrailHref?: string | null;
  /** When the approval path is complete, emphasize the card for sponsor-first scanning. */
  readonly emphasizeComplete?: boolean;
}) {
  const row = props.row;
  const emphasizeComplete = props.emphasizeComplete === true;
  const auditTrailHref = props.auditTrailHref?.trim() ?? "";
  const submitted = row.requestedUtc.trim().length > 0;
  const reviewed = (row.reviewedBy?.trim().length ?? 0) > 0;
  const approved = row.status.trim().toLowerCase() === "approved";
  const promoteReady = approved && reviewed;

  const steps: { label: string; done: boolean; detail: string }[] = [
    {
      label: "Submitted for review",
      done: submitted,
      detail: submitted ? `Requested by ${row.requestedBy}` : "Awaiting submission",
    },
    {
      label: "Architecture review completed",
      done: reviewed,
      detail: reviewed ? `Reviewer ${row.reviewedBy ?? "—"}` : "Pending reviewer action",
    },
    {
      label: "Governance approval recorded",
      done: approved,
      detail: approved ? "Governance approval recorded" : row.status.trim() || "Not approved yet",
    },
    {
      label: "Approved for governed use",
      done: promoteReady,
      detail: promoteReady
        ? "Governance record ready for diligence, architecture review, and implementation planning."
        : "Complete approval before citing this package in the next stage of review and implementation planning.",
    },
  ];

  return (
    <Card
      className={cn(
        "mb-8 border-teal-200 bg-teal-50/40 dark:border-teal-900 dark:bg-teal-950/25",
        emphasizeComplete && promoteReady
          ? "mb-8 border-2 border-teal-600 shadow-xl ring-1 ring-teal-500/25 dark:border-teal-500"
          : null,
      )}
    >
      <CardHeader className="pb-2">
        <CardTitle className="text-base text-neutral-900 dark:text-neutral-50">
          {approved ? "This package completed the approval path" : "Approval status for this review"}
        </CardTitle>
        <div className="space-y-2 text-sm text-neutral-700 dark:text-neutral-300">
          <p className="m-0 leading-relaxed">
            <span className="font-semibold text-neutral-900 dark:text-neutral-100">Recorded package:</span> finalized manifest
            version <span className="font-semibold">{row.manifestVersion}</span> — approved for governed use as the architecture
            record for this review package. Use the audit trail for timestamps and actor identifiers when you need evidence
            detail.
          </p>
          {reviewed ? (
            <p className="m-0 text-xs leading-relaxed text-neutral-600 dark:text-neutral-400">
              Reviewer <span className="font-medium text-neutral-800 dark:text-neutral-200">{row.reviewedBy ?? "—"}</span>
              {" · "}
              Request owner <span className="font-medium text-neutral-800 dark:text-neutral-200">{row.requestedBy ?? "—"}</span>
              {" — "}
              weekly exception-volume sampling applies while monitored PHI posture stays open.
            </p>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <p className="m-0 mb-3 text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
          Approval path for this package
        </p>
        <ol className="m-0 flex list-none flex-col gap-3 p-0 sm:flex-row sm:items-stretch sm:gap-2">
          {steps.map((s, index) => (
            <li key={s.label} className="flex min-w-0 flex-1 sm:items-stretch">
              {index > 0 ? (
                <span
                  aria-hidden
                  className="me-2 hidden w-px shrink-0 self-stretch bg-neutral-300 sm:block dark:bg-neutral-600"
                />
              ) : null}
              <div
                className={cn(
                  "min-w-0 flex-1 rounded-md border px-3 py-2 text-sm",
                  s.label === "Approved for governed use" && promoteReady
                    ? "border-teal-600 bg-teal-50/95 ring-2 ring-teal-500/30 dark:border-teal-500 dark:bg-teal-950/55"
                    : "border-neutral-200 bg-white/90 dark:border-neutral-700 dark:bg-neutral-950/40",
                )}
              >
                <p className="m-0 flex items-center gap-2 font-semibold text-neutral-900 dark:text-neutral-50">
                  <span aria-hidden className={s.done ? "text-teal-700 dark:text-teal-300" : "text-neutral-400"}>
                    {s.done ? "✓" : "○"}
                  </span>
                  {s.label}
                </p>
                <p className="m-0 mt-1 text-xs text-neutral-600 dark:text-neutral-400">{s.detail}</p>
              </div>
            </li>
          ))}
        </ol>
        <p className="m-0 mt-4 text-xs leading-relaxed text-neutral-600 dark:text-neutral-400">
          Production deployments and environment promotions remain with your enterprise change board — ArchLucid records governed
          architecture evidence; operations teams gate execution separately.
        </p>
      </CardContent>
      {auditTrailHref.length > 0 ? (
        <CardFooter className="flex flex-col items-stretch gap-2 border-t border-teal-200/70 pt-4 dark:border-teal-900/60">
          <Button type="button" asChild variant="primary" size="lg" className="w-full sm:w-auto">
            <Link href={auditTrailHref}>Open audit trail</Link>
          </Button>
        </CardFooter>
      ) : null}
    </Card>
  );
}
