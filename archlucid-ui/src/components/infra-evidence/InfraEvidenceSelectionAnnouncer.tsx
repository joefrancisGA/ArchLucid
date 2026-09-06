"use client";

import { useEffect, useState } from "react";

type InfraEvidenceSelectionAnnouncerProps = {
  readonly message: string | null;
  readonly testId?: string;
};

export function InfraEvidenceSelectionAnnouncer(
  props: InfraEvidenceSelectionAnnouncerProps,
): React.JSX.Element {
  const { message, testId = "infra-evidence-selection-announcer" } = props;
  const [announcement, setAnnouncement] = useState<string>("");

  useEffect(() => {
    if (message == null || message.trim().length === 0) {
      return;
    }

    setAnnouncement(message.trim());
  }, [message]);

  return (
    <p className="sr-only" role="status" aria-live="polite" data-testid={testId}>
      {announcement}
    </p>
  );
}
