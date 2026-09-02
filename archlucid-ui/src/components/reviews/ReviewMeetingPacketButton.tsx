"use client";

import { cn } from "@/lib/utils";
import { useState, type ReactElement } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ExportTrackedAnchor } from "@/components/ExportTrackedAnchor";
import { getRunPackageExportUrl } from "@/lib/api/downloads-api";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

export type ReviewMeetingPacketStep = {
  readonly id: string;
  readonly label: string;
  readonly description: string;
  readonly href?: string;
  readonly downloadLabel?: string;
};

export type ReviewMeetingPacketButtonProps = {
  readonly runId: string;
  readonly findingsQueueHref: string;
  readonly diagramHref?: string | null;
  readonly sponsorSynopsisHref?: string | null;
  readonly disabled?: boolean;
};

function buildMeetingPacketSteps(props: ReviewMeetingPacketButtonProps): readonly ReviewMeetingPacketStep[] {
  const runId = props.runId.trim();

  return [
    {
      id: "diagram",
      label: "Architecture diagram",
      description: "Open the review topology graph for screen-share or print.",
      href: props.diagramHref ?? `/architecture/reviews/${encodeURIComponent(runId)}#architecture-graph`,
    },
    {
      id: "findings",
      label: "Findings register",
      description: "Scoped findings queue for this review — triage open risks before the meeting.",
      href: props.findingsQueueHref,
    },
    {
      id: "decisions",
      label: "Decision record (DOCX)",
      description: "Consulting-style decision record export for CAB packets.",
      href: getRunPackageExportUrl(runId, "docx"),
      downloadLabel: "Download DOCX",
    },
    {
      id: "board-pack",
      label: "Review board package (PDF)",
      description: "Finalized review board PDF when the review is finalized.",
      href: getRunPackageExportUrl(runId, "pdf"),
      downloadLabel: "Download PDF",
    },
    {
      id: "sponsor-synopsis",
      label: "Sponsor briefing export",
      description: "Executive bottom-line summary for non-architect attendees.",
      href: props.sponsorSynopsisHref ?? `/architecture/reviews/${encodeURIComponent(runId)}#sponsor-briefing`,
    },
  ];
}

export function buildReviewMeetingPacketSteps(
  props: ReviewMeetingPacketButtonProps,
): readonly ReviewMeetingPacketStep[] {
  return buildMeetingPacketSteps(props);
}

/** One-click CAB / meeting packet launcher with ordered exports and deep links. */
export function ReviewMeetingPacketButton(props: ReviewMeetingPacketButtonProps): ReactElement {
  const [open, setOpen] = useState(false);
  const steps = buildMeetingPacketSteps(props);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={props.disabled === true}
          data-testid="review-meeting-packet-trigger"
        >
          Prepare meeting packet
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Prepare for review meeting</DialogTitle>
          <DialogDescription>
            Ordered packet for CAB or architecture review meetings: diagram, findings, decision record, and sponsor
            synopsis. Download or open each item in sequence.
          </DialogDescription>
        </DialogHeader>
        <ol className="m-0 list-decimal space-y-3 pl-5">
          {steps.map((step, index) => (
            <li key={step.id} className="space-y-1" data-testid={`review-meeting-packet-step-${step.id}`}>
              <p className={cn("m-0 font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
                {index + 1}. {step.label}
              </p>
              <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>{step.description}</p>
              {step.href !== undefined ? (
                <p className="m-0">
                  {step.downloadLabel !== undefined ? (
                    <ExportTrackedAnchor
                      href={step.href}
                      className={cn("font-medium underline underline-offset-2", OPERATOR_TYPOGRAPHY.helper)}
                    >
                      {step.downloadLabel}
                    </ExportTrackedAnchor>
                  ) : (
                    <a className={cn("font-medium underline underline-offset-2", OPERATOR_TYPOGRAPHY.helper)} href={step.href}>
                      Open →
                    </a>
                  )}
                </p>
              ) : null}
            </li>
          ))}
        </ol>
        <DialogFooter>
          <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
