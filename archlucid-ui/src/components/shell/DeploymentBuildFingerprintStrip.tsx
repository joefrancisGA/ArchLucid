"use client";

import { cn } from "@/lib/utils";

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
      className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.micro, props.className)}
      title="Deployment fingerprint (UI build + configured API host)"
    >
      UI build {formatShortCommitSha(fingerprint.frontendCommitSha)} · {fingerprint.buildTimestamp} · env{" "}
      {fingerprint.environment} · API {fingerprint.apiUpstreamHost}
    </p>
  );
}
