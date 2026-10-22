function hostnameLabels(hostname: string): readonly string[] {
  return hostname.toLowerCase().split(".").filter((label) => label.length > 0);
}

function hostnameEndsWithLabels(hostname: string, suffixLabels: readonly string[]): boolean {
  const labels = hostnameLabels(hostname);

  if (labels.length < suffixLabels.length) {
    return false;
  }

  const offset = labels.length - suffixLabels.length;

  for (let index = 0; index < suffixLabels.length; index += 1) {
    if (labels[offset + index] !== suffixLabels[index]) {
      return false;
    }
  }

  return true;
}

/** Slack incoming webhooks are issued only on hooks.slack.com. */
export function isSlackIncomingWebhookHostname(hostname: string): boolean {
  return hostnameEndsWithLabels(hostname, ["hooks", "slack", "com"]);
}

/** Microsoft Teams / Office 365 connector webhook hosts. */
export function isTeamsWebhookHostname(hostname: string): boolean {
  if (hostnameEndsWithLabels(hostname, ["outlook", "office", "com"])) {
    return true;
  }

  return hostnameEndsWithLabels(hostname, ["webhook", "office", "com"]);
}
