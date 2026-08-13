"use client";

import { cn } from "@/lib/utils";

import { FieldHelpTooltip } from "@/components/FieldHelpTooltip";
import {
  formatShortCommitSha,
  readClientDeploymentFingerprint,
} from "@/lib/deployment-fingerprint";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

type DeploymentBuildFingerprintStripProps = {
  readonly className?: string;
};

/** Low-risk footer marker to confirm which UI build and API host the shell is using. */
export function DeploymentBuildFingerprintStrip(props: DeploymentBuildFingerprintStripProps): React.JSX.Element {
  const fingerprint = readClientDeploymentFingerprint();

  return (
    <p
      data-testid="deployment-build-fingerprint"
      className={cn("m-0 inline-flex flex-wrap items-center gap-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.micro, props.className)}
    >
      <span>
        UI build {formatShortCommitSha(fingerprint.frontendCommitSha)} · {fingerprint.buildTimestamp} · env{" "}
        {fingerprint.environment} · API {fingerprint.apiUpstreamHost}
      </span>
      <FieldHelpTooltip
        label="Deployment fingerprint"
        hint="UI build commit, timestamp, environment, and configured API host for this shell session."
      />
    </p>
  );
}
