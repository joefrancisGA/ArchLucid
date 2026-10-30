function readWireProperties(wireJson: string): Record<string, unknown> | null {
  try {
    const parsed: unknown = JSON.parse(wireJson);

    if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
      return null;
    }

    const record = parsed as {
      properties?: Record<string, unknown>;
      Properties?: Record<string, unknown>;
    };

    const properties = record.properties ?? record.Properties;

    if (properties === undefined || typeof properties !== "object" || Array.isArray(properties)) {
      return null;
    }

    return properties;
  } catch {
    return null;
  }
}

function readWireBooleanProperty(wireJson: string, propertyKey: string): boolean | undefined {
  const properties = readWireProperties(wireJson);

  if (properties === null) {
    return undefined;
  }

  const raw = properties[propertyKey];

  if (typeof raw !== "string") {
    return undefined;
  }

  const trimmed = raw.trim();

  if (trimmed.length === 0) {
    return undefined;
  }

  if (trimmed.localeCompare("true", undefined, { sensitivity: "accent" }) === 0) {
    return true;
  }

  if (trimmed.localeCompare("false", undefined, { sensitivity: "accent" }) === 0) {
    return false;
  }

  return undefined;
}

export function readArchitectureIntelligenceSeverityStoredFromWire(
  wireJson: string,
): boolean | undefined {
  return readWireBooleanProperty(wireJson, "architectureIntelligence.severityStored");
}

export function readArchitectureIntelligenceHumanReviewStoredFromWire(
  wireJson: string,
): boolean | undefined {
  return readWireBooleanProperty(wireJson, "architectureIntelligence.humanReviewStatusStored");
}
