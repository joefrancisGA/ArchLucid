"use client";

import type { JSX } from "react";

import {
  buildCollabRecentActorPresence,
  type CollabRecentActor,
  type CollabRecentActorPresenceModel,
} from "@/lib/collab-recent-actor-presence";
import { Button } from "@/components/ui/button";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export type CollabRecentActorPresenceStripProps = {
  /**
   * Recent disposition actors from the parent (props-driven).
   * Prefer wiring from disposition history — never invent live viewers.
   */
  readonly recentActors?: readonly CollabRecentActor[] | null;
  /** Convenience single-actor prop for parents that only know the latest other reviewer. */
  readonly recentDispositionActor?: CollabRecentActor | null;
  readonly className?: string;
  /** Optional override for tests; defaults to {@link buildCollabRecentActorPresence}. */
  readonly model?: CollabRecentActorPresenceModel;
  /** UTC timestamp when the parent last received disposition history. */
  readonly asOfUtc?: string | null;
  /** Refetch disposition history without leaving inspect. */
  readonly onRefresh?: () => void;
  readonly refreshBusy?: boolean;
};

function resolveActors(
  props: CollabRecentActorPresenceStripProps,
): readonly CollabRecentActor[] | null {
  if (props.recentActors !== null && props.recentActors !== undefined) {
    return props.recentActors;
  }

  if (props.recentDispositionActor !== null && props.recentDispositionActor !== undefined) {
    return [props.recentDispositionActor];
  }

  return null;
}

function formatAsOfLocal(asOfUtc: string): string {
  const parsed = Date.parse(asOfUtc);

  if (Number.isNaN(parsed)) {
    return asOfUtc;
  }

  return new Date(parsed).toLocaleString();
}

/**
 * TB-2248 — Soft honesty strip for recent disposition actors (not live presence).
 * Complements concurrent-update notices; does not duplicate them.
 */
export function CollabRecentActorPresenceStrip(
  props: CollabRecentActorPresenceStripProps,
): JSX.Element {
  const model =
    props.model ??
    buildCollabRecentActorPresence({
      recentActors: resolveActors(props),
    });
  const asOfLabel =
    props.asOfUtc !== null && props.asOfUtc !== undefined && props.asOfUtc.trim().length > 0
      ? formatAsOfLocal(props.asOfUtc)
      : null;

  return (
    <aside
      className={cn(
        "mb-3 space-y-1 rounded-md border border-neutral-200 bg-neutral-50/50 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-900/30",
        props.className,
      )}
      aria-labelledby="collab-recent-actor-presence-heading"
      data-testid="collab-recent-actor-presence"
      data-has-recent-actors={model.hasRecentActors ? "true" : "false"}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3
          id="collab-recent-actor-presence-heading"
          className={cn(
            "m-0 font-medium text-al-text-primary",
            OPERATOR_TYPOGRAPHY.helper,
          )}
        >
          {model.heading}
        </h3>
        {props.onRefresh !== undefined ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-7 px-2"
            data-testid="collab-recent-actor-presence-refresh"
            disabled={props.refreshBusy === true}
            onClick={props.onRefresh}
          >
            {props.refreshBusy === true ? "Refreshing…" : "Refresh"}
          </Button>
        ) : null}
      </div>
      {asOfLabel !== null ? (
        <p
          className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
          data-testid="collab-recent-actor-presence-as-of"
        >
          As of {asOfLabel}
        </p>
      ) : null}
      <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>{model.body}</p>
      <p
        className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
        data-testid="collab-recent-actor-presence-honesty"
      >
        {model.honestyNote}
      </p>
    </aside>
  );
}
