"use client";
import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import { SPONSOR_DASHBOARD_HREF } from "@/lib/sponsor-dashboard-route";
import { auditTrailNavHref } from "@/lib/audit-nav-paths";
import { SPONSOR_REPORT_PATH } from "@/lib/sponsor-report-navigation";
import Link from "next/link";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type ExportDeliverableDialogProps = {
  readonly runId: string;
  readonly manifestId?: string | null;
};

type DeliverableAudience = "sponsor" | "grc" | "board";

const AUDIENCE_OPTIONS: readonly { id: DeliverableAudience; label: string; description: string }[] = [
  { id: "sponsor", label: "Sponsor report", description: "Sponsor-safe PDF with outcomes and risk posture." },
  { id: "grc", label: "GRC diligence bundle", description: "Audit trail excerpts, findings, and policy references." },
  { id: "board", label: "Board packet", description: "Condensed narrative for governance committees." },
];

/** Unified export/deliverable picker for post-commit reviews. */
export function ExportDeliverableDialog(props: ExportDeliverableDialogProps) {
  const [audience, setAudience] = useState<DeliverableAudience>("sponsor");
  const encodedRun = encodeURIComponent(props.runId);

  const exportHref =
    audience === "sponsor"
      ? `${SPONSOR_REPORT_PATH}?runId=${encodedRun}`
      : audience === "grc"
        ? auditTrailNavHref(props.runId)
        : `${SPONSOR_DASHBOARD_HREF}?runId=${encodedRun}`;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size="sm" data-testid="export-deliverable-trigger">
          Create deliverable
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create deliverable</DialogTitle>
          <DialogDescription>Choose an audience and open the matching export workflow.</DialogDescription>
        </DialogHeader>
        <fieldset className="m-0 space-y-2 border-0 p-0">
          <legend className={cn("mb-2 font-medium text-neutral-900 dark:text-neutral-100", OPERATOR_TYPOGRAPHY.body)}>Audience</legend>
          {AUDIENCE_OPTIONS.map((option) => (
            <label
              key={option.id}
              className="flex cursor-pointer gap-2 rounded-md border border-neutral-200 p-3 dark:border-neutral-700"
            >
              <input
                type="radio"
                name="deliverable-audience"
                value={option.id}
                checked={audience === option.id}
                onChange={() => setAudience(option.id)}
                className="mt-1"
              />
              <span>
                <span className={cn("block font-semibold", OPERATOR_TYPOGRAPHY.cardTitle)}>{option.label}</span>
                <span className={cn("block text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>{option.description}</span>
              </span>
            </label>
          ))}
        </fieldset>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="default" size="sm" asChild>
            <Link href={exportHref}>Open export</Link>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
