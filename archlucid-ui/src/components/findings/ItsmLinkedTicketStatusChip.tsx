"use client";

import { cn } from "@/lib/utils";
import type { ReactElement } from "react";

import { StatusTag } from "@/components/ui/status-tag";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

export type ItsmLinkedTicketStatusChipProps = {
  readonly summary: string | null | undefined;
  readonly className?: string;
};

/** Parses `KEY (state)` fragments from governance queue ITSM summary text for row-level status chips. */
export function parseItsmLinkedTicketSummary(summary: string): readonly { readonly key: string; readonly state: string }[] {
  const trimmed = summary.trim();

  if (trimmed.length === 0) {
    return [];
  }

  return trimmed.split(",").flatMap((segment) => {
    const piece = segment.trim();

    if (piece.length === 0) {
      return [];
    }

    const openParen = piece.lastIndexOf("(");
    const closeParen = piece.endsWith(")") ? piece.length - 1 : -1;

    if (openParen > 0 && closeParen > openParen) {
      return [
        {
          key: piece.slice(0, openParen).trim(),
          state: piece.slice(openParen + 1, closeParen).trim(),
        },
      ];
    }

    return [{ key: piece, state: "Linked" }];
  });
}

function resolveItsmStateTagKind(state: string): "ready" | "needs-attention" | "neutral" | "blocked" {
  const normalized = state.trim().toLowerCase();

  if (normalized.includes("closed") || normalized.includes("resolved") || normalized.includes("done")) {
    return "ready";
  }

  if (normalized.includes("blocked") || normalized.includes("failed")) {
    return "blocked";
  }

  if (
    normalized.includes("progress")
    || normalized.includes("open")
    || normalized.includes("new")
    || normalized.includes("pending")
  ) {
    return "needs-attention";
  }

  return "neutral";
}

/** Prominent ITSM ticket key/state chip for governance finding rows (not only Supporting detail). */
export function ItsmLinkedTicketStatusChip(props: ItsmLinkedTicketStatusChipProps): ReactElement | null {
  const tickets = parseItsmLinkedTicketSummary(props.summary ?? "");

  if (tickets.length === 0) {
    return null;
  }

  const primary = tickets[0];
  const overflow = tickets.length > 1 ? ` +${tickets.length - 1}` : "";

  return (
    <span
      className={cn("inline-flex flex-wrap items-center gap-1", props.className)}
      data-testid="itsm-linked-ticket-status-chip"
    >
      <StatusTag kind={resolveItsmStateTagKind(primary.state)} label={`${primary.key}${overflow}`} />
      <span className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.micro)}>{primary.state}</span>
    </span>
  );
}
