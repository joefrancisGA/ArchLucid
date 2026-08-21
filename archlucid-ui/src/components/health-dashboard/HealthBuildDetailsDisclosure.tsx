"use client";

import { cn } from "@/lib/utils";

import { CollapsibleSection } from "@/components/CollapsibleSection";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { VersionInfoResponse } from "@/lib/health-dashboard-types";
import { formatProcessUptime } from "@/lib/format-process-uptime";
import { isInternalTestBuildVersion } from "@/lib/health-build-identity";

type Props = {
  readonly version: VersionInfoResponse | null;
  readonly testId?: string;
  readonly uiBuildStrip?: React.ReactNode;
};

export function HealthBuildDetailsDisclosure(props: Props) {
  if (props.version === null) {
    return null;
  }

  const internalTestBuild = isInternalTestBuildVersion(props.version);

  return (
    <CollapsibleSection title="Build details" defaultOpen={false} sectionTestId={props.testId ?? "health-build-details"}>
      {internalTestBuild ? (
        <p className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
          Build labels in this environment use internal test identifiers — detailed version strings are hidden.
        </p>
      ) : (
        <dl className={cn("grid gap-2 sm:grid-cols-2", OPERATOR_TYPOGRAPHY.body)}>
          <div>
            <dt className="text-al-text-secondary">Release version</dt>
            <dd className="m-0 text-al-text-primary">{props.version.informationalVersion ?? " — "}</dd>
          </div>
          <div>
            <dt className="text-al-text-secondary">Environment</dt>
            <dd className="m-0 text-al-text-primary">{props.version.environment ?? " — "}</dd>
          </div>
          <div>
            <dt className="text-al-text-secondary">Build timestamp</dt>
            <dd className="m-0 text-al-text-primary">{props.version.buildTimestamp ?? " — "}</dd>
          </div>
          <div>
            <dt className="text-al-text-secondary">Service uptime</dt>
            <dd className="m-0 text-al-text-primary">{formatProcessUptime(props.version.processUptimeSeconds)}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-al-text-secondary">Source commit</dt>
            <dd className={cn("m-0 font-mono text-al-text-primary", OPERATOR_TYPOGRAPHY.micro)}>{props.version.commitSha ?? " — "}</dd>
          </div>
        </dl>
      )}
      {props.uiBuildStrip !== undefined ? <div className="mt-3">{props.uiBuildStrip}</div> : null}
    </CollapsibleSection>
  );
}
