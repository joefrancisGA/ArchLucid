"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

import { CollapsibleSection } from "@/components/CollapsibleSection";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { commitHrefIfChanged, readWindowLocationSearch } from "@/lib/navigation/replace-if-href-changed";
import {
  parsePipelineTimelineEventIdFromSearch,
  pipelineTimelineEventDisclosureHrefFromSearch,
} from "@/lib/runs/pipeline-timeline-event-disclosure-url";
import type { PipelineTimelineItem } from "@/types/authority";

type PipelineTimelineEventTechnicalDisclosureProps = {
  readonly row: PipelineTimelineItem;
  readonly eventLabel: string;
};

export function PipelineTimelineEventTechnicalDisclosure(
  props: PipelineTimelineEventTechnicalDisclosureProps,
): React.JSX.Element {
  const { row, eventLabel } = props;
  const pathname = usePathname() ?? "/";
  const [open, setOpenState] = useState(
    () =>
      parsePipelineTimelineEventIdFromSearch(
        typeof window === "undefined"
          ? null
          : new URLSearchParams(window.location.search).get("pipelineTimelineEventId"),
      ) === row.eventId,
  );
  const openRef = useRef(open);
  openRef.current = open;

  const syncOpenToUrl = useCallback(
    (detailsOpen: boolean) => {
      commitHrefIfChanged(
        pipelineTimelineEventDisclosureHrefFromSearch(
          readWindowLocationSearch(),
          detailsOpen ? row.eventId : null,
          pathname,
        ),
        { notify: false },
      );
    },
    [pathname, row.eventId],
  );

  const setOpen = useCallback(
    (detailsOpen: boolean) => {
      if (openRef.current === detailsOpen) {
        return;
      }

      openRef.current = detailsOpen;
      setOpenState(detailsOpen);
      syncOpenToUrl(detailsOpen);
    },
    [syncOpenToUrl],
  );

  useEffect(() => {
    const syncOpenFromUrl = (): void => {
      const next =
        parsePipelineTimelineEventIdFromSearch(
          new URLSearchParams(window.location.search).get("pipelineTimelineEventId"),
        ) === row.eventId;

      if (openRef.current === next) {
        return;
      }

      openRef.current = next;
      setOpenState(next);
    };

    syncOpenFromUrl();
    window.addEventListener("popstate", syncOpenFromUrl);

    return () => {
      window.removeEventListener("popstate", syncOpenFromUrl);
    };
  }, [row.eventId]);

  return (
    <CollapsibleSection
      title="Technical details"
      summaryAriaLabel={`Technical details for ${eventLabel}`}
      open={open}
      onToggle={setOpen}
      className="mb-0 border-0 bg-transparent p-0"
    >
      <div className="space-y-1 border-s border-neutral-200 ps-3 dark:border-neutral-700">
        <p className="m-0">
          <span className="font-medium text-neutral-600 dark:text-neutral-400">Event id:</span>{" "}
          <code className={OPERATOR_TYPOGRAPHY.helper}>{row.eventId}</code>
        </p>
        <p className="m-0">
          <span className="font-medium text-neutral-600 dark:text-neutral-400">Event type:</span>{" "}
          <code className={OPERATOR_TYPOGRAPHY.helper}>{row.eventType}</code>
        </p>
        {row.correlationId ? (
          <p className="m-0">
            <span className="font-medium text-neutral-600 dark:text-neutral-400">Correlation:</span>{" "}
            {row.correlationId}
          </p>
        ) : null}
      </div>
    </CollapsibleSection>
  );
}
