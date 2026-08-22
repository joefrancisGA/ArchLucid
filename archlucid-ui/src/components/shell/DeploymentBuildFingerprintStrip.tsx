"use client";

import { cn } from "@/lib/utils";

import { FieldHelpTooltip } from "@/components/FieldHelpTooltip";
import {
  formatCiBuildNumberLabel,
  formatDeploymentBuildFingerprintLine,
  readClientDeploymentFingerprint,
  type ClientDeploymentFingerprint,
  type DeploymentBuildFingerprintStripVariant,
} from "@/lib/deployment-fingerprint";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

type DeploymentBuildFingerprintStripProps = {
  readonly className?: string;
  readonly variant?: DeploymentBuildFingerprintStripVariant;
};

export function DeploymentBuildFingerprintStrip(props: DeploymentBuildFingerprintStripProps): React.JSX.Element | null {
  const variant = props.variant ?? "full";
  const fingerprint = readClientDeploymentFingerprint();

  switch (variant) {
    case "compact":
      return renderCompactCiBuildMark(fingerprint.ciBuildNumber, props.className);
    case "full":
      return renderFullDeploymentFingerprint(fingerprint, props.className);
    default: {
      const exhaustive: never = variant;
      return exhaustive;
    }
  }
}

function renderCompactCiBuildMark(ciBuildNumber: string, className: string | undefined): React.JSX.Element | null {
  const label = formatCiBuildNumberLabel(ciBuildNumber);
  if (label === null) { return null; }
  return (
    <p data-testid="deployment-build-fingerprint" className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.micro, className)}>
      {label}
    </p>
  );
}

function renderFullDeploymentFingerprint(
  fingerprint: ClientDeploymentFingerprint,
  className: string | undefined,
): React.JSX.Element {
  return (
    <p data-testid="deployment-build-fingerprint" className={cn("m-0 inline-flex flex-wrap items-center gap-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.micro, className)}>
      <span>{formatDeploymentBuildFingerprintLine(fingerprint)}</span>
      <FieldHelpTooltip label="Deployment fingerprint" hint="CI build number, UI commit, timestamp, environment, and configured API host for this shell session." />
    </p>
  );
}