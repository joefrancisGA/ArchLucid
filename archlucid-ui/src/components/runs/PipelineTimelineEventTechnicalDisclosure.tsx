"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { CollapsibleSection } from "@/components/CollapsibleSection";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
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
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();
  const pipelineTimelineEventIdParam = searchParams.get("pipelineTimelineEventId");
  const [open, setOpenState] = useState(
    () => parsePipelineTimelineEventIdFromSearch(pipelineTimelineEventIdParam) === row.eventId,
  );

  const syncOpenToUrl = useCallback(
    (detailsOpen: boolean) => {
      router.replace(
        pipelineTimelineEventDisclosureHrefFromSearch(
          searchParams.toString(),
          detailsOpen ? row.eventId : null,
          pathname,
        ),
        { scroll: false },
      );
    },
    [pathname, router, row.eventId, searchParams],
  );

  const setOpen = useCallback(
    (detailsOpen: boolean) => {
      setOpenState(detailsOpen);
      syncOpenToUrl(detailsOpen);
    },
    [syncOpenToUrl],
  );

  useEffect(() => {
    setOpenState(parsePipelineTimelineEventIdFromSearch(pipelineTimelineEventIdParam) === row.eventId);
  }, [pipelineTimelineEventIdParam, row.eventId]);

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
