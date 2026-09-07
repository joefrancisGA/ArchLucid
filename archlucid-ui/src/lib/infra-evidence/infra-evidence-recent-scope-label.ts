export type InfraEvidenceRecentScopeLabelInput = {
  readonly surface: "ask" | "hub" | "explorer";
  readonly cloudResourceId?: string | null;
  readonly resourceDisplayName?: string | null;
  readonly externalResourceId?: string | null;
  readonly snapshotId?: string | null;
  readonly controlNumber?: string | null;
  readonly controlTitle?: string | null;
  readonly controlId?: string | null;
  readonly workQueueLabel?: string | null;
  readonly namePrefix?: string | null;
  readonly resourceType?: string | null;
  readonly resourceGroup?: string | null;
  readonly diffId?: string | null;
  readonly findingId?: string | null;
  readonly instanceId?: string | null;
  readonly correspondenceId?: string | null;
};

function shortIdentifier(value: string | null | undefined): string | null {
  const trimmed = value?.trim() ?? "";

  if (trimmed.length === 0) {
    return null;
  }

  if (trimmed.length <= 12) {
    return trimmed;
  }

  return `…${trimmed.slice(-8)}`;
}

function formatAuditControlSegment(
  controlNumber?: string | null,
  controlTitle?: string | null,
  controlId?: string | null,
): string | null {
  const labelParts = [controlNumber, controlTitle].filter((part) => part != null && part.trim().length > 0);

  if (labelParts.length > 0) {
    return labelParts.join(" · ");
  }

  const shortControlId = shortIdentifier(controlId);

  return shortControlId != null ? `control ${shortControlId}` : null;
}

function resolveResourceLabel(input: InfraEvidenceRecentScopeLabelInput): string | null {
  const displayName = input.resourceDisplayName?.trim() ?? "";

  if (displayName.length > 0) {
    return displayName;
  }

  const externalResourceId = input.externalResourceId?.trim() ?? "";

  if (externalResourceId.length > 0) {
    const segments = externalResourceId.split("/");

    return segments[segments.length - 1] ?? externalResourceId;
  }

  return shortIdentifier(input.cloudResourceId);
}

export function formatInfraEvidenceRecentScopeLabel(
  input: InfraEvidenceRecentScopeLabelInput,
): string | null {
  const segments: string[] = [];

  if (input.surface === "explorer") {
    segments.push("Explorer");

    if (input.workQueueLabel != null && input.workQueueLabel.trim().length > 0) {
      segments.push(input.workQueueLabel.trim());
    }

    if (input.namePrefix != null && input.namePrefix.trim().length > 0) {
      segments.push(`name ${input.namePrefix.trim()}`);
    }

    if (input.resourceType != null && input.resourceType.trim().length > 0) {
      const typeSegments = input.resourceType.trim().split("/");
      const shortType = typeSegments[typeSegments.length - 1] ?? input.resourceType.trim();

      segments.push(`type ${shortType}`);
    }

    if (input.resourceGroup != null && input.resourceGroup.trim().length > 0) {
      segments.push(`rg ${input.resourceGroup.trim()}`);
    }

    if (input.snapshotId != null && input.snapshotId.trim().length > 0) {
      const shortSnapshotId = shortIdentifier(input.snapshotId);

      if (shortSnapshotId != null) {
        segments.push(`snapshot ${shortSnapshotId}`);
      }
    }

    return segments.join(" · ");
  }

  const resourceLabel = resolveResourceLabel(input);

  if (resourceLabel != null) {
    segments.push(resourceLabel);
  }

  const auditLabel = formatAuditControlSegment(
    input.controlNumber,
    input.controlTitle,
    input.controlId,
  );

  if (auditLabel != null) {
    segments.push(auditLabel);
  }

  if (input.workQueueLabel != null && input.workQueueLabel.trim().length > 0) {
    segments.push(input.workQueueLabel.trim());
  }

  const shortSnapshotId = shortIdentifier(input.snapshotId);

  if (shortSnapshotId != null) {
    segments.push(`snapshot ${shortSnapshotId}`);
  }

  const shortDiffId = shortIdentifier(input.diffId);

  if (shortDiffId != null) {
    segments.push(`diff ${shortDiffId}`);
  }

  const shortFindingId = shortIdentifier(input.findingId);

  if (shortFindingId != null) {
    segments.push(`finding ${shortFindingId}`);
  }

  const shortInstanceId = shortIdentifier(input.instanceId);

  if (shortInstanceId != null) {
    segments.push(`remediation ${shortInstanceId}`);
  }

  const shortCorrespondenceId = shortIdentifier(input.correspondenceId);

  if (shortCorrespondenceId != null) {
    segments.push(`diagram ${shortCorrespondenceId}`);
  }

  if (segments.length === 0) {
    return null;
  }

  const surfacePrefix = input.surface === "ask" ? "Ask" : input.surface === "hub" ? "Hub" : null;

  if (surfacePrefix != null && resourceLabel == null) {
    return [surfacePrefix, ...segments].join(" · ");
  }

  return segments.join(" · ");
}
